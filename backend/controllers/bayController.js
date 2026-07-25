    import Bay from '../models/Bay.js';

export const listBays = async (req, res) => {
  try {
    const { branch, status } = req.query;
    let query = {};
    if (branch) {
      query.branch = branch;
    }
    if (status) {
      query.status = status;
    }
    const bays = await Bay.find(query);
    res.json(bays);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createBay = async (req, res) => {
  try {
    const { name, branch, status, description } = req.body;
    if (!name || !branch) {
      return res.status(400).json({ error: "Tên khoang và chi nhánh là bắt buộc." });
    }
    const newBay = new Bay({ name, branch, status, description });
    await newBay.save();
    res.status(201).json(newBay);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBay = async (req, res) => {
  try {
    const { name, status, description } = req.body;
    const bay = await Bay.findById(req.params.id);
    if (!bay) {
      return res.status(404).json({ error: "Không tìm thấy khoang rửa này." });
    }
    if (name) bay.name = name;
    if (status) bay.status = status;
    if (description !== undefined) bay.description = description;
    await bay.save();
    res.json(bay);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteBay = async (req, res) => {
  try {
    const bay = await Bay.findByIdAndDelete(req.params.id);
    if (!bay) {
      return res.status(404).json({ error: "Không tìm thấy khoang rửa này." });
    }
    res.json({ message: "Xóa khoang rửa xe thành công." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
