import { userDb } from '../db/db.js';

// Helper function to convert SQLite datetime string to ISO format
const formatDateTime = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toISOString();
};

export const UserModel = {
    create: async (email, password, name) => {
        try {
            const user = await userDb.createUser(email, password, name);
            // Align with OpenAPI User schema
            return {
                id: user.id.toString(),
                email: user.email,
                name: user.name,
                createdAt: formatDateTime(user.createdAt),
                updatedAt: formatDateTime(user.updatedAt)
            };
        } catch (error) {
            throw error; // Re-throw for controller to handle
        }
    },

    getAll: async () => {
        try {
            const users = await userDb.getAllUsers();
            // Align with OpenAPI User schema
            return users.map(user => ({
                id: user.id.toString(),
                email: user.email,
                name: user.name,
                createdAt: formatDateTime(user.createdAt),
                updatedAt: formatDateTime(user.updatedAt)
            }));
        } catch (error) {
            throw error;
        }
    },

    getById: async (id) => {
        try {
            const user = await userDb.getUserById(id);
            // Align with OpenAPI User schema
            return {
                id: user.id.toString(),
                email: user.email,
                name: user.name,
                createdAt: formatDateTime(user.createdAt),
                updatedAt: formatDateTime(user.updatedAt)
            };
        } catch (error) {
            throw error;
        }
    },

    update: async (id, userData) => {
        try {
            const user = await userDb.updateUser(id, userData);
            // Align with OpenAPI User schema
            return {
                id: user.id.toString(),
                email: user.email,
                name: user.name,
                createdAt: formatDateTime(user.createdAt),
                updatedAt: formatDateTime(user.updatedAt)
            };
        } catch (error) {
            throw error;
        }
    },

    delete: async (id) => {
        try {
            const result = await userDb.deleteUser(id);
            return result;
        } catch (error) {
            throw error;
        }
    },

    validateCredentials: async (email, password) => {
        try {
            const user = await userDb.validatePassword(email, password);
            if (user) {
                return {
                    id: user.id.toString(),
                    email: user.email,
                    name: user.name
                };
            }
            return null;
        } catch (error) {
            throw error;
        }
    }
};