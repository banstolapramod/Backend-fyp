const { User } = require("../models");

exports.createUser = async (req, res) => {
  try {
    const { name, email, password_hash } = req.body;

    const user = await User.create({
      name,
      email,
      password_hash,
    });

    return res.status(201).json(user);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
};
