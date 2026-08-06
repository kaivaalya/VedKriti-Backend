# 🩺  Backend

Backend API for the **VedKriti Doctor Appointment Booking Platform**. This backend powers the entire platform by handling authentication, doctor verification, appointment booking, video consultations, email notifications, and administrative operations.

---

##  Features

###  Patient Features
- Secure user registration with email verification.
- JWT-based authentication.
- Browse doctors by specialization and availability.
- Book appointments in real time.
- Cancel and reschedule appointments.
- Join online video consultations.
- Rate and review doctors.
- Email confirmation after successful booking.
- Appointment reminder notifications.

###  Doctor Features
- Doctor registration and authentication.
- Upload verification documents.
- Profile management.
- Manage consultation availability.
- Conduct online video consultations.
- Receive patient ratings and reviews.

###  Admin Features
- Secure admin authentication.
- Verify or reject doctor accounts.
- Review uploaded doctor documents.
- Manage doctor and patient accounts.
- View platform statistics:
  - Total Doctors
  - Verified Doctors
  - Pending Verifications
  - Total Patients
  - Total Bookings
  - Doctor Verification Percentage
  - Consultation Percentage

---

#  Tech Stack

## Backend
- Node.js
- Express.js

## Database
- MongoDB
- Mongoose

## Authentication
- JWT (JSON Web Token)
- Email Verification

## Cloud & Services
- Cloudinary
- Brevo (Email Service)
- Agora SDK (Video Consultation)

## Others
- REST APIs
- Multer
- Bcrypt
- Cookie Parser
- Node Cron

---

#  Project Structure

```text
VedKriti-Backend/
│
├── src/
│   ├── configs/
│   ├── controllers/
│   ├── jobs/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── app.js
│
├── server.js
├── seedAdmin.js
├── package.json
├── package-lock.json
├── .gitignore
├── LICENSE
└── README.md
```

---

#  Getting Started

## Prerequisites

Make sure you have installed:

- Node.js (v18 or above)
- npm
- MongoDB Atlas or Local MongoDB

---

## Clone the Repository

```bash
git clone https://github.com/kaivaalya/VedKriti-Backend.git
```

```bash
cd VedKriti-Backend
```

---

## Install Dependencies

```bash
npm install
```

---


---

## Run the Server

Development

```bash
npm run dev
```

Production

```bash
node server.js
```

---

#  Main Modules

- Authentication
- Patient Management
- Doctor Management
- Admin Dashboard
- Appointment Management
- Doctor Verification
- Video Consultation
- Email Notifications
- File Uploads
- Background Scheduled Jobs

---

#  Authentication

The API uses **JWT (JSON Web Token)** for secure authentication.

Protected routes require an access token in the Authorization header.

```
Authorization: Bearer <your_access_token>
```

---

#  API Categories

- Authentication APIs
- Patient APIs
- Doctor APIs
- Appointment APIs
- Admin APIs
- Video Consultation APIs
- Review APIs

---

#  Future Scope

- Online Payment Gateway
- Electronic Medical Records
- Digital Prescriptions
- AI-based Doctor Recommendations
- Multi-language Support
- Advanced Analytics Dashboard
- Push Notifications
- Hospital Management Module

---

#  Contributors

Developed by the **VedKriti Team**.

---

#  License

This project is licensed under the **MIT License**.
