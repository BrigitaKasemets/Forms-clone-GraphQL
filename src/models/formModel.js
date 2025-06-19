import { formDb } from '../db/db.js';

// Helper function to convert SQLite datetime string to REST API compatible format
const formatDateTime = (dateString) => {
    if (!dateString) return null;
    // SQLite returns datetime in 'YYYY-MM-DD HH:MM:SS' format
    // Return it as-is to match REST API format
    return dateString;
};

export const FormModel = {
    create: async (userId, title, description) => {
        try {
            const form = await formDb.createForm(userId, title, description);
            return {
                id: form.id.toString(),
                userId: form.userId.toString(),
                title: form.title,
                description: form.description,
                createdAt: formatDateTime(form.createdAt),
                updatedAt: formatDateTime(form.updatedAt)
            };
        } catch (error) {
            throw error;
        }
    },

    getAll: async (userId = null, filter = {}, sort = null) => {
        try {
            const forms = await formDb.getAllForms(userId, filter);
            return forms.map(form => ({
                id: form.id.toString(),
                userId: form.userId.toString(),
                title: form.title,
                description: form.description,
                createdAt: formatDateTime(form.createdAt),
                updatedAt: formatDateTime(form.updatedAt)
            }));
        } catch (error) {
            throw error;
        }
    },

    getById: async (id) => {
        try {
            const form = await formDb.getFormById(id);
            return {
                id: form.id.toString(),
                userId: form.userId.toString(),
                title: form.title,
                description: form.description,
                createdAt: formatDateTime(form.createdAt),
                updatedAt: formatDateTime(form.updatedAt)
            };
        } catch (error) {
            throw error;
        }
    },

    getByUserId: async (userId) => {
        try {
            const forms = await formDb.getAllForms(userId);
            return forms.map(form => ({
                id: form.id.toString(),
                userId: form.userId.toString(),
                title: form.title,
                description: form.description,
                createdAt: formatDateTime(form.createdAt),
                updatedAt: formatDateTime(form.updatedAt)
            }));
        } catch (error) {
            throw error;
        }
    },

    update: async (id, formData) => {
        try {
            const form = await formDb.updateForm(id, formData);
            return {
                id: form.id.toString(),
                userId: form.userId.toString(),
                title: form.title,
                description: form.description,
                createdAt: formatDateTime(form.createdAt),
                updatedAt: formatDateTime(form.updatedAt)
            };
        } catch (error) {
            throw error;
        }
    },

    delete: async (id) => {
        try {
            return await formDb.deleteForm(id);
        } catch (error) {
            throw error;
        }
    }
};