const Hospital = require("../models/Hospital");

exports.registerHospital = async (req, res) => {
  try {
    const hospital = await Hospital.create({ ...req.body, userId: req.user.id });
    res.status(201).json(hospital);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find().populate("userId", "name email");
    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ userId: req.user.id });
    if (!hospital) return res.status(404).json({ message: "Hospital profile not found" });
    res.json(hospital);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
