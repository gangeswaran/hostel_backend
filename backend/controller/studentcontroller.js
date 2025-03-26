const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const faceapi = require("face-api.js");
const canvas = require("canvas");
const fs = require("fs");
const path = require("path");

const Student = require("../model/Student");
const { Canvas, Image, ImageData } = canvas;

// ✅ Monkey-patch for face-api.js
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const JWT_SECRET = process.env.JWT_SECRET;

// ✅ Ensure models are loaded
async function loadModels() {
  const modelPath = path.join(__dirname, "../models");
  await faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
  console.log("✅ Face detection models loaded.");
}

const { upload } = require("../config/cloudinary");
// ✅ Register Student Route
exports.registerStudent = async (req, res) => {  
  const { name, dob, address, age, dept, year, aadharnumber, registernum, email, password } = req.body;
  const imagePath = req.file.path;
  // ❌ Missing Fields
  if (!req.file || !name || !dob || !address || !age || !dept || !year || !aadharnumber || !registernum || !email || !password) {
    return res.status(400).json({ success: false, message: "❌ Missing required fields!" });
  }

  try {
    // ✅ Check if student is already registered
    const existingStudent = await Student.findOne({ registernum });
    if (existingStudent) {
      return res.status(409).json({ success: false, message: "❌ Student already registered!" });
    }

    // ✅ Load Face Detection Models
    await loadModels();

    const imageUrl = req.file.path; // Cloudinary URL
    console.log("🖼️ Uploaded Image URL:", imageUrl);

    // ✅ Load Image from Cloudinary
    const img = await canvas.loadImage(imageUrl);
    const input = faceapi.createCanvasFromMedia(img);

    // ✅ Face Detection
    const detection = await faceapi.detectSingleFace(input, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      console.error("❌ No face detected in image:", imageUrl);
      return res.status(400).json({ success: false, message: "❌ No face detected!" });
    }

    console.log("😀 Face detected with descriptor length:", detection.descriptor.length);

    // ✅ Save Student Data
    const hashedPassword = await bcrypt.hash(password, 10);
    const newStudent = new Student({
      name,
      dob,
      address,
      age,
      dept,
      year,
      aadharnumber,
      registernum,
      email,
      password,
      imagePath, // Save Cloudinary URL instead of local path
      descriptor: Array.from(detection.descriptor),
    });

    await newStudent.save();
    res.status(201).json({ success: true, message: "✅ Student Registered Successfully!" });
  } catch (error) {
    console.error("❌ Registration Error:", error);
    res.status(500).json({ success: false, message: "❌ Server Error", error: error.message });
  }
};

// ✅ Export Upload Middleware
exports.upload = upload;












// ✅ Calculate Distance Between Two Face Descriptors
exports.calculateDistance = (descriptor1, descriptor2) => {
  return faceapi.euclideanDistance(descriptor1, descriptor2);
};








exports.getStudentInfo = async (req, res) => {
  try {
    const student = await Student.findById(req.student.id);
    if (!student) return res.status(404).json({ success: false, message: "�� Student not found!" });
    res.json({ success: true, message: "✅ Student Information Retrieved!", student });
    } catch (error) {
    console.error("Get Student Info Error:", error);
    res.status(500).json({ success: false, message: "�� Server Error", error: error.message });
  }
  };





// Controller to get timetable for a student
exports.getStudentTimetable = async (req, res) => {
  try {
    const studentId = req.user.id; // Assuming user is authenticated and ID is available from JWT

    // Find student details
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Fetch timetable based on student's department and year
    const timetable = await Timetable.findOne({ dept: student.dept, year: student.year });
    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    res.status(200).json({ timetable });
  } catch (error) {
    console.error("Error fetching timetable:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const RegisterNumber =require("../model/RegisterNumber")
exports.storeRegisterNumber = async (req, res) => {
  try {
    const { registerNumbers } = req.body;

    if (!Array.isArray(registerNumbers)) {
        return res.status(400).json({ message: "registerNumbers must be an array" });
    }

    // Check if a document already exists; if yes, update it
    let existingData = await RegisterNumber.findOne();
    if (existingData) {
        existingData.registerNumbers = registerNumbers;
        await existingData.save();
    } else {
        await RegisterNumber.create({ registerNumbers });
    }

    res.status(201).json({ message: "Register numbers saved successfully" });
} catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
}
};

exports.getRegisterNumber = async (req, res) => {
  try {
      const { num } = req.params; // Get register number from request params

      const data = await RegisterNumber.findOne();
      if (!data || !data.registerNumbers.includes(Number(num))) {
          return res.status(404).json({ message: "Register number not found" });
      }

      res.status(200).json({ message: "Register number exists", num ,valid: true });
  } catch (error) {
      res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};
