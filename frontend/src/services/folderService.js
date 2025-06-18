import apiClient from './api';

export const fetchFolders = async () => {
  const res = await apiClient.get('/folders/');
  return res.data; // array of folders
};

export const createFolder = async (payload) => {
  const res = await apiClient.post('/folders/', payload);
  return res.data;
};

export const updateFolder = async (id, payload) => {
  const res = await apiClient.patch(`/folders/${id}/`, payload);
  return res.data;
};

export const deleteFolder = async (id) => {
  await apiClient.delete(`/folders/${id}/`);
};
