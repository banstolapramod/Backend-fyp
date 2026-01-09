const pool = require("../config/db");

const UserModel = {
    findByEmail: async (email) => {
        const res = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );
        return res.rows[0];
    },

    findById: async (user_id) => {  // Changed to user_id (UUID)
        const res = await pool.query(
            "SELECT user_id, name, email, phone_number, address, role, profile_picture, created_at, updated_at FROM users WHERE user_id = $1",
            [user_id]
        );
        return res.rows[0];
    },

    create: async (name, email, password, phone_number = null, address = null, role = 'user', profile_picture = null) => {
        const res = await pool.query(
            "INSERT INTO users (name, email, password, phone_number, address, role, profile_picture) " +
            "VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING user_id, name, email, phone_number, address, role, profile_picture, created_at, updated_at",
            [name, email, password, phone_number, address, role, profile_picture]
        );
        return res.rows[0];
    },

    updateProfile: async (user_id, name, email, phone_number = null, address = null, role = null, profile_picture = null) => {
        const updateFields = [];
        const updateValues = [];

        if (name) {
            updateFields.push("name = $" + (updateValues.length + 1));
            updateValues.push(name);
        }
        if (email) {
            updateFields.push("email = $" + (updateValues.length + 1));
            updateValues.push(email);
        }
        if (phone_number !== undefined) {
            updateFields.push("phone_number = $" + (updateValues.length + 1));
            updateValues.push(phone_number);
        }
        if (address !== undefined) {
            updateFields.push("address = $" + (updateValues.length + 1));
            updateValues.push(address);
        }
        if (role) {
            updateFields.push("role = $" + (updateValues.length + 1));
            updateValues.push(role);
        }
        if (profile_picture !== undefined) {
            updateFields.push("profile_picture = $" + (updateValues.length + 1));
            updateValues.push(profile_picture);
        }

        // If no fields to update, return
        if (updateFields.length === 0) return null;

        const query = "UPDATE users SET " + updateFields.join(", ") + " WHERE user_id = $" + (updateValues.length + 1) + 
            " RETURNING user_id, name, email, phone_number, address, role, profile_picture, updated_at";
        
        updateValues.push(user_id);  // Adding user_id to the last position

        const res = await pool.query(query, updateValues);
        return res.rows[0];
    },

    updatePassword: async (user_id, password) => {
        await pool.query(
            "UPDATE users SET password = $1 WHERE user_id = $2",
            [password, user_id]
        );
    }
};

module.exports = UserModel;
