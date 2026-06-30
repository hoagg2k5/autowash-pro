import Branch from '../models/Branch.js';
import { logAdminAction } from '../utils/auditLogger.js';

export const listBranches = async (req, res) => {
  try {
    const { isActive } = req.query;
    let query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    const branches = await Branch.find(query);
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createBranch = async (req, res) => {
  try {
    const { name, address, phone, isActive } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Tên chi nhánh là bắt buộc." });
    }

    const existing = await Branch.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ error: "Tên chi nhánh này đã tồn tại." });
    }

    const newBranch = new Branch({
      name: name.trim(),
      address: address || '',
      phone: phone || '',
      isActive: isActive !== undefined ? isActive : true
    });

    await newBranch.save();
    await logAdminAction(req, 'CREATE_BRANCH', `Tạo chi nhánh mới: "${name.trim()}".`);
    res.status(201).json(newBranch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const { name, address, phone, isActive } = req.body;
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ error: "Không tìm thấy chi nhánh này." });
    }

    if (name && name.trim() !== branch.name) {
      const existing = await Branch.findOne({ name: name.trim() });
      if (existing) {
        return res.status(400).json({ error: "Tên chi nhánh này đã được sử dụng." });
      }
      branch.name = name.trim();
    }

    if (address !== undefined) branch.address = address;
    if (phone !== undefined) branch.phone = phone;
    if (isActive !== undefined) branch.isActive = isActive;

    await branch.save();
    await logAdminAction(req, 'EDIT_BRANCH', `Cập nhật thông tin chi nhánh: "${branch.name}".`);
    res.json(branch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ error: "Không tìm thấy chi nhánh này." });
    }

    await Branch.deleteOne({ _id: req.params.id });
    await logAdminAction(req, 'DELETE_BRANCH', `Xóa chi nhánh: "${branch.name}".`);
    res.json({ message: "Xóa chi nhánh thành công." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
