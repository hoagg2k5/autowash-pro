import { 
  getServices, 
  addService, 
  updateService, 
  deleteService 
} from '../db-helper.js';

export const listServices = async (req, res) => {
  try {
    const services = await getServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createService = async (req, res) => {
  try {
    const newService = await addService(req.body);
    res.status(201).json(newService);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const editService = async (req, res) => {
  try {
    const updated = await updateService(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeService = async (req, res) => {
  try {
    await deleteService(req.params.id);
    res.json({ message: "Xóa gói dịch vụ thành công." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
