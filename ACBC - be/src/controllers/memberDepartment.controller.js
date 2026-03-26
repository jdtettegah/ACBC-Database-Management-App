const { poolPromise, sql } = require("../services/db");
const { logActivity } = require("./activity.controller");


/**
 * ASSIGN MEMBER TO DEPARTMENT
 */
exports.assignMemberToDepartment = async (req, res) => {

  const { member_id, member_code, department_id, date_joined } = req.body;

  if (!member_id || !department_id) {
    return res.status(400).json({
      message: "member_id and department_id are required"
    });
  }

  try {

    const pool = await poolPromise;

    // Prevent duplicates
    const check = await pool.request()
      .input("member_id", sql.Int, member_id)
      .input("member_code", sql.NVarChar, member_code)
      .input("department_id", sql.Int, department_id)
      .query(`
        SELECT id
        FROM MemberDepartments
        WHERE member_id=@member_id
          AND member_code=@member_code
          AND department_id=@department_id
          AND is_active=1
      `);

      

    if (check.recordset.length > 0) {
      return res.status(409).json({
        message: "Member already assigned"
      });
    }


    await pool.request()
      .input("member_id", sql.Int, member_id)
      .input("member_code", sql.NVarChar, member_code)
      .input("department_id", sql.Int, department_id)
      .input("date_joined", sql.Date, date_joined || new Date())
      .query(`
        INSERT INTO MemberDepartments
        (member_id, member_code, department_id, date_joined, is_active)
        VALUES
        (@member_id, @member_code, @department_id, @date_joined, 1)
      `);

    res.status(201).json({
      message: "Assigned successfully"
    });

    await logActivity(
      "department",
      `Member assigned to department (Member ID: ${member_id}, Dept ID: ${department_id})`
    );

  } catch (err) {

    console.error(err);
    res.status(500).json({
      message: "Failed to assign"
    });

  }
  console.log("BODY:", req.body);

};



/**
 * GET MEMBERS BY DEPARTMENT
 */
exports.getMembersByDepartment = async (req, res) => {

  const { deptId } = req.params;

  try {

    const pool = await poolPromise;

    const result = await pool.request()
      .input("dept_id", sql.Int, deptId)
      .query(`
        SELECT
          md.id AS memberDepartmentId,
          m.id AS member_id,
          m.member_code,
          m.first_name,
          m.last_name,
          m.other_names,
          m.phone
        FROM MemberDepartments md
        JOIN Members m ON md.member_id = m.id
        WHERE
          md.department_id = @dept_id
          AND md.is_active = 1
        ORDER BY m.first_name
      `);

    res.json(result.recordset);

  } catch (err) {

    console.error(err);
    res.status(500).json({
      message: "Failed to fetch members"
    });

  }
};



/**
 * REMOVE MEMBER FROM DEPARTMENT
 */
exports.removeMemberFromDepartment = async (req, res) => {
    const { id } = req.params; // must be the id from MemberDepartments
    console.log("DELETE PARAMS:", req.params);
    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }
  
    try {
      const pool = await poolPromise;
  
      const result = await pool.request()
        .input("id", sql.Int, id )
        .query(`
          DELETE FROM memberDepartments
          WHERE id = @id
        `);
  
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: "Assignment not found or already removed" });
      }

      
  
      res.json({ message: "Removed successfully" });

      await logActivity(
        "department",
        `Member removed from department (Assignment ID: ${id})`
      );
  
    } catch (err) {
      console.error("Remove error:", err);
      res.status(500).json({ message: "Failed to remove" });
    }
  };
  

exports.getDepartmentsByMember = async (req, res) => {

    const { member_id } = req.params; // member_code
  
    try {
  
      const pool = await poolPromise;
  
      const result = await pool.request()
        .input("member_id", sql.Int, member_id)
        .query(`
          SELECT
            md.id,
            m.member_code,
            m.first_name,
            m.last_name,
            m.phone,
            d.id,
            d.name AS department,
            d.description
          FROM MemberDepartments md
          JOIN Departments d ON md.department_id = d.id
          JOIN members m ON md.member_code
          WHERE
            md.member_id = @member_id
            AND md.is_active = 1
        `);
  
      res.json(result.recordset);
  
    } catch (err) {
  
      console.error(err);
  
      res.status(500).json({
        message: "Failed to fetch member departments"
      });
  
    }
  };
  
  exports.reassignMember = async (req, res) => {

    const {
      member_id,
      member_code,
      old_department_id,
      new_department_id,
      date_joined
    } = req.body;
  
    if (!member_id || !old_department_id || !new_department_id) {
      return res.status(400).json({
        message: "member_id, old_department_id, new_department_id are required"
      });
    }
  
    if (old_department_id === new_department_id) {
      return res.status(400).json({
        message: "Cannot reassign to same department"
      });
    }
  
    try {
  
      const pool = await poolPromise;
  
      /* TRANSACTION (important) */
      const transaction = new sql.Transaction(pool);
  
      await transaction.begin();
  
      try {
  
        const request = new sql.Request(transaction);
  
        /* 1️⃣ Deactivate old */
  
        await request
          .input("member_id", sql.Int, member_id)
          .input("old_dept", sql.Int, old_department_id)
          .query(`
            UPDATE MemberDepartments
            SET is_active = 0,
                updated_at = SYSDATETIME()
            WHERE member_id = @member_id
              AND department_id = @old_dept
              AND is_active = 1
          `);
  
  
        /* 2️⃣ Check duplicate */
  
        const check = await request
          .input("new_dept", sql.Int, new_department_id)
          .query(`
            SELECT id
            FROM MemberDepartments
            WHERE member_id = @member_id
              AND department_id = @new_dept
              AND is_active = 1
          `);
  
        if (check.recordset.length > 0) {
          await transaction.rollback();

          
  
          return res.status(409).json({
            message: "Member already in this department"
          });
        }
  
  
        /* 3️⃣ Insert new */
  
        await request
          .input("member_code", sql.NVarChar, member_code)
          .input("date_joined", sql.Date, date_joined || new Date())
          .query(`
            INSERT INTO MemberDepartments
            (member_id, member_code, department_id, date_joined, is_active)
            VALUES
            (@member_id, @member_code, @new_dept, @date_joined, 1)
          `);
  
  
        await transaction.commit();

        
  
        res.json({ message: "Reassigned successfully" });

        await logActivity(
          "department",
          `Member reassigned (Member ID: ${member_id} from ${old_department_id} to ${new_department_id})`
        );
  
      } catch (err) {
  
        await transaction.rollback();
        throw err;
      }
  
    } catch (err) {
  
      console.error("Reassign error:", err);
  
      res.status(500).json({
        message: "Failed to reassign"
      });
  
    }
  };