const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // If running in browser and deployed on Vercel or public host, use relative '/api'
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api';
  }
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Custom fetch wrapper with automatic headers & JSON parsing
 */
async function fetchApi(endpoint, options = {}) {
  const token = localStorage.getItem('laporjalan_token');
  
  const headers = {
    ...(options.isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    
    if (!contentType.includes('application/json')) {
      const rawText = await response.text();
      console.warn(`[API] Endpoint ${endpoint} returned non-JSON (${response.status}):`, rawText.substring(0, 150));
      throw new Error(`Gagal terhubung ke Server API (${response.status}). Periksa koneksi backend Anda.`);
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Gagal memproses permintaan API');
    }
    return data;
  } catch (error) {
    console.warn(`[API] ${endpoint} request error:`, error.message);
    throw error;
  }
}

// ----------------------------------------------------
// AUTH API
// ----------------------------------------------------
export const authApi = {
  login: async (email, password) => {
    return fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (userData) => {
    return fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getMe: async () => {
    return fetchApi('/auth/me', {
      method: 'GET',
    });
  },

  updateProfile: async (profileData) => {
    return fetchApi('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  verifyEmail: async (token) => {
    return fetchApi(`/auth/verify-email?token=${token}`, {
      method: 'GET',
    });
  },

  checkVerificationStatus: async (email, token) => {
    const query = email ? `email=${encodeURIComponent(email)}` : `token=${encodeURIComponent(token)}`;
    return fetchApi(`/auth/check-verification?${query}`, {
      method: 'GET',
    });
  },
};

// ----------------------------------------------------
// UPLOAD API
// ----------------------------------------------------
export const uploadApi = {
  uploadPhoto: async (file) => {
    const formData = new FormData();
    formData.append('photo', file);

    return fetchApi('/upload', {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  },
};

// ----------------------------------------------------
// REPORTS API
// ----------------------------------------------------
export const reportsApi = {
  getAll: async (status = 'Semua', search = '') => {
    const queryParams = new URLSearchParams();
    if (status && status !== 'Semua') queryParams.append('status', status);
    if (search) queryParams.append('search', search);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return fetchApi(`/reports${queryString}`, {
      method: 'GET',
    });
  },

  getById: async (id) => {
    return fetchApi(`/reports/${id}`, {
      method: 'GET',
    });
  },

  create: async (reportData) => {
    return fetchApi('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  },

  updateDetails: async (id, reportData) => {
    return fetchApi(`/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reportData),
    });
  },

  updateStatus: async (id, status, note) => {
    return fetchApi(`/reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
  },
};

// ----------------------------------------------------
// ADMIN USER MANAGEMENT API
// ----------------------------------------------------
export const adminApi = {
  getUsers: async () => {
    return fetchApi('/admin/users', {
      method: 'GET',
    });
  },

  updateUserStatus: async (id, status) => {
    return fetchApi(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  deleteUser: async (id) => {
    return fetchApi(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// ----------------------------------------------------
// REGIONS MASTER DATA API
// ----------------------------------------------------
export const regionsApi = {
  getProvinces: async () => {
    return fetchApi('/regions/provinces', { method: 'GET' });
  },
  getRegencies: async (provinceId = '32') => {
    return fetchApi(`/regions/regencies?province_id=${provinceId}`, { method: 'GET' });
  },
  getDistricts: async (regencyName) => {
    return fetchApi(`/regions/districts?regency_name=${encodeURIComponent(regencyName)}`, { method: 'GET' });
  },
  getVillages: async (districtName) => {
    return fetchApi(`/regions/villages?district_name=${encodeURIComponent(districtName)}`, { method: 'GET' });
  },
};
