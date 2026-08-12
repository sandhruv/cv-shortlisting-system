const CodingTest = require("../models/CodingTest");
const Application = require("../models/Application");
const Job = require("../models/Job");

// HR creates & assigns a coding test to a student application
exports.createCodingTest = async (req, res) => {
  try {
    const { applicationId, title, description, language, testCases, durationMinutes } = req.body;

    if (!applicationId || !title || !description) {
      return res.status(400).json({ message: "Application ID, title, and description are required" });
    }

    const application = await Application.findById(applicationId).populate("job");
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Ensure HR / Admin authorized
    if (
      application.job.postedBy.toString() !== req.user.id &&
      !["Admin", "LPU Admin", "HR", "LPU Faculty"].includes(req.user.role)
    ) {
      return res.status(403).json({ message: "Not authorized to assign test for this job" });
    }

    const codingTest = await CodingTest.create({
      job: application.job._id,
      application: application._id,
      student: application.student,
      createdBy: req.user.id,
      title,
      description,
      language: language || "python",
      testCases: Array.isArray(testCases) ? testCases : [],
      durationMinutes: durationMinutes || 30,
      status: "assigned",
    });

    // Update application status
    application.status = "coding_test_assigned";
    await application.save();

    res.status(201).json({ message: "Coding test assigned successfully", codingTest });
  } catch (err) {
    console.error("❌ Error in createCodingTest:", err);
    res.status(500).json({ message: err.message });
  }
};

// Student: get assigned tests
exports.getStudentTests = async (req, res) => {
  try {
    const tests = await CodingTest.find({ student: req.user.id })
      .populate("job", "title location")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(tests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HR: get tests created by HR
exports.getHRTests = async (req, res) => {
  try {
    const tests = await CodingTest.find({ createdBy: req.user.id })
      .populate("job", "title location")
      .populate("student", "name email uid")
      .populate("application")
      .sort({ createdAt: -1 });

    res.json(tests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single test by ID
exports.getTestById = async (req, res) => {
  try {
    const test = await CodingTest.findById(req.params.id)
      .populate("job", "title location")
      .populate("student", "name email uid")
      .populate("createdBy", "name email");

    if (!test) {
      return res.status(404).json({ message: "Coding test not found" });
    }

    // Check authorization: must be student assigned or creator/admin
    const isStudent = test.student._id.toString() === req.user.id;
    const isCreatorOrAdmin =
      test.createdBy._id.toString() === req.user.id ||
      ["Admin", "LPU Admin", "HR", "LPU Faculty"].includes(req.user.role);

    if (!isStudent && !isCreatorOrAdmin) {
      return res.status(403).json({ message: "Not authorized to view this test" });
    }

    res.json(test);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Student starts the test
exports.startTest = async (req, res) => {
  try {
    const test = await CodingTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    if (test.student.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!test.startedAt) {
      test.startedAt = new Date();
      test.status = "in_progress";
      await test.save();
    }

    res.json({ message: "Test started", test });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Student submits code solution
exports.submitTest = async (req, res) => {
  try {
    const { submittedCode, submissionNotes } = req.body;
    const test = await CodingTest.findById(req.params.id);

    if (!test) return res.status(404).json({ message: "Test not found" });
    if (test.student.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    test.submittedCode = submittedCode || test.submittedCode || "";
    test.submissionNotes = submissionNotes || "";
    test.submittedAt = new Date();
    test.status = "submitted";
    await test.save();

    // Update application status
    await Application.findByIdAndUpdate(test.application, {
      status: "coding_test_submitted",
    });

    res.json({ message: "Test submitted successfully", test });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// HR reviews the test submission
exports.reviewTest = async (req, res) => {
  try {
    const { score, hrFeedback, verdict } = req.body;
    const test = await CodingTest.findById(req.params.id);

    if (!test) return res.status(404).json({ message: "Test not found" });

    if (
      test.createdBy.toString() !== req.user.id &&
      !["Admin", "LPU Admin", "HR", "LPU Faculty"].includes(req.user.role)
    ) {
      return res.status(403).json({ message: "Not authorized to review this test" });
    }

    if (score !== undefined) test.score = score;
    if (hrFeedback !== undefined) test.hrFeedback = hrFeedback;
    if (verdict !== undefined) test.verdict = verdict;
    test.status = "reviewed";

    await test.save();

    // If passed, update application status to shortlisted for interview!
    if (verdict === "passed") {
      await Application.findByIdAndUpdate(test.application, {
        status: "coding_test_passed",
      });
    } else if (verdict === "failed") {
      await Application.findByIdAndUpdate(test.application, {
        status: "coding_test_failed",
      });
    }

    res.json({ message: "Test review saved", test });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Upload periodic proctoring camera snapshot
exports.uploadSnapshot = async (req, res) => {
  try {
    const fs = require("fs");
    const path = require("path");
    const { imageBase64 } = req.body;

    const test = await CodingTest.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    if (!imageBase64) {
      return res.status(400).json({ message: "No image data provided" });
    }

    const uploadsDir = path.join(__dirname, "../uploads/proctoring", req.params.id);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const filename = `snapshot_${Date.now()}.jpg`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    const relativePath = `/uploads/proctoring/${req.params.id}/${filename}`;
    test.proctorSnapshots.push({
      imagePath: relativePath,
      capturedAt: new Date(),
    });

    await test.save();

    res.json({ message: "Snapshot saved", relativePath, totalSnapshots: test.proctorSnapshots.length });
  } catch (err) {
    console.error("❌ Error saving snapshot:", err);
    res.status(500).json({ message: err.message });
  }
};
