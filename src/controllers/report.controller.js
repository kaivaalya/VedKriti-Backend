const Report  = require('../models/Report.model');
const Booking = require('../models/Booking.model');
const { uploadToCloudinary, deleteFromCloudinary } = require('../configs/cloudinary.config');
const AppError = require('../utils/AppError');


// PUT /api/report/upload-report?id=<patientId>
// For PATIENT: uploads their own report (id = their own patID)
// For DOCTOR:  uploads a prescription linked to a booking
// Body (multipart): file, title, category, bookingId (optional)

exports.uploadReport = async (req, res, next) => {
  try {
    if (!req.file) return next(new AppError('No file attached.', 400));

    const { title, category, bookingId } = req.body;
    if (!title) return next(new AppError('Report title is required.', 400));

    let patID;
    let uploadedBy;

    if (req.user.role === 'PATIENT') {
      patID      = req.user.id;
      uploadedBy = 'PATIENT';
    } else if (req.user.role === 'DOCTOR') {
      // Doctor uploads prescription: must link to a booking they own
      if (!bookingId) return next(new AppError('bookingId is required when doctor uploads a report.', 400));

      const booking = await Booking.findOne({ _id: bookingId, docID: req.user.id });
      if (!booking) return next(new AppError('Booking not found or not yours.', 404));
      if (!['CONSULTING', 'DONE'].includes(booking.status)) {
        return next(new AppError('Report can only be uploaded during or after consultation.', 400));
      }

      patID      = booking.patID.toString();
      uploadedBy = 'DOCTOR';
    } else {
      return next(new AppError('Unauthorised.', 403));
    }

    const result = await uploadToCloudinary(req.file.buffer, 'medical_reports', 'auto');

    const report = await Report.create({
      patID,
      bookingID:  bookingId || null,
      uploadedBy,
      title,
      fileUrl:    result.secure_url,
      publicId:   result.public_id,
      fileType:   req.file.mimetype.startsWith('image') ? 'image' : (req.file.mimetype === 'application/pdf' ? 'pdf' : 'other'),
      category:   category || 'OTHER',
    });

    res.status(201).json({ status: 'SUCCESS', reportId: report._id, data: report });
  } catch (err) {
    next(err);
  }
};


// GET /api/report/get-reports?id=<patientId>
// PATIENT  – can only fetch their own reports (id ignored; uses token)
// DOCTOR   – can fetch a patient's reports IF they have/had a consultation relation

exports.getReports = async (req, res, next) => {
  try {
    let targetPatID;

    if (req.user.role === 'PATIENT') {
      targetPatID = req.user.id;
    } else if (req.user.role === 'DOCTOR') {
      const { id } = req.query;
      if (!id) return next(new AppError('Patient id (query ?id=) is required.', 400));

      // Security: doctor must have (or have had) a confirmed booking with this patient
      const relation = await Booking.findOne({
        docID: req.user.id,
        patID: id,
        status: { $in: ['CONFIRMED', 'CONSULTING', 'DONE'] },
      });
      if (!relation) {
        return next(new AppError('You do not have access to this patient\'s reports.', 403));
      }
      targetPatID = id;
    } else {
      return next(new AppError('Unauthorised.', 403));
    }

    const reports = await Report.find({ patID: targetPatID }).sort({ createdAt: -1 });

    if (!reports.length) {
      return next(new AppError('No reports found for this patient.', 404));
    }

    res.status(200).json({ status: 'SUCCESS', count: reports.length, data: reports });
  } catch (err) {
    next(err);
  }
};


// DELETE /api/report/:reportId   (PATIENT only – own reports)

exports.deleteReport = async (req, res, next) => {
  try {
    if (req.user.role !== 'PATIENT') return next(new AppError('Only patients can delete their own reports.', 403));

    const report = await Report.findOneAndDelete({ _id: req.params.reportId, patID: req.user.id });
    if (!report) return next(new AppError('Report not found.', 404));

    await deleteFromCloudinary(report.publicId, report.fileType === 'pdf' ? 'raw' : 'image');

    res.status(200).json({ status: 'SUCCESS', message: 'Report deleted.' });
  } catch (err) {
    next(err);
  }
};
