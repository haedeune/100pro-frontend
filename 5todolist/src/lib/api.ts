import axios from 'axios';

// 기본 Axios 인스턴스 생성
const api = axios.create({
  baseURL: 'http://localhost:8000', // 여기에 API 기본 URL을 넣습니다.
});

// 요청 인터셉터 추가 (토큰 자동 주입)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // 예시로 로컬 스토리지에서 토큰을 가져옵니다.
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`; // 토큰을 헤더에 추가
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;