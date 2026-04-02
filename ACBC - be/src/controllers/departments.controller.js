const { poolPromise, sql } = require('../services/db');
const { logActivity } = require("./activity.controller");

/**
 * CREATE DEPARTMENT
 */
exports.createDepartment = async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Department name is required' });
    }

    try {
        const pool = await poolPromise;

        await pool.request()
            .input('name', sql.NVarChar, name)
            .input('description', sql.NVarChar, description || null)
            .query(`
                INSERT INTO Departments (name, description, is_active)
                VALUES (@name, @description, 1)
            `);


           

        res.status(201).json({ message: 'Department created successfully' });

        await logActivity(
            "department",
            `Department created: ${name}`
          );

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create department' });
    }
};


/**
 * GET ALL DEPARTMENTS
 */
exports.getAllDepartments = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT 
                d.id,
                d.name,
                d.description,
                d.is_active,
                d.created_at,

                COUNT(md.id) AS member_count

            FROM Departments d

            LEFT JOIN MemberDepartments md 
                ON d.id = md.department_id
                AND md.is_active = 1

            WHERE d.is_active = 1

            GROUP BY 
                d.id,
                d.name,
                d.description,
                d.is_active,
                d.created_at

            ORDER BY d.name
        `);

        res.json(result.recordset);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch departments' });
    }
};

/**
 * GET DEPARTMENT BY ID
 */
exports.getDepartmentById = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT id, name, description, is_active, created_at
                FROM Departments
                WHERE id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Department not found' });
        }

        res.json(result.recordset[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch department' });
    }
};


/**
 * UPDATE DEPARTMENT
 */
exports.updateDepartment = async (req, res) => {
    const { id } = req.params;
    const { name, description, is_active } = req.body;

    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name || null)
            .input('description', sql.NVarChar, description || null)
            .input('is_active', sql.Bit, is_active)
            .query(`
                UPDATE Departments
                SET
                    name = ISNULL(@name, name),
                    description = ISNULL(@description, description),
                    is_active = ISNULL(@is_active, is_active)
                WHERE id = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Department not found' });
        }


        

        res.json({ message: 'Department updated successfully' });

        await logActivity(
            "department",
            `Department updated (ID: ${id})`
          );

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update department' });
    }
};


/**
 * DEACTIVATE DEPARTMENT (SOFT DELETE)
 */
exports.deleteDepartment = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                UPDATE Departments
                SET is_active = 0
                WHERE id = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Department not found' });
        }


        

        res.json({ message: 'Department deactivated successfully' });

        await logActivity(
            "department",
            `Department deactivated (ID: ${id})`
          );

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete department' });
    }
};
