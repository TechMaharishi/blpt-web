import axios, { AxiosError } from "axios"
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios"

// Create axios instance with default config
export const apiClient: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // Required for cookies (sessions)
    timeout: 10000, // 10 seconds timeout
})

// Request Interceptor
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // You can add logic here to attach tokens if needed
        // const token = localStorage.getItem('token');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config
    },
    (error: AxiosError) => {
        return Promise.reject(error)
    }
)

// Response Interceptor
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response
    },
    async (error: AxiosError) => {
        // Handle 401 Unauthorized errors (session expired)
        if (error.response?.status === 401) {
            // Redirect to login or handle token refresh
            // window.location.href = '/login';
            console.warn("Unauthorized access - redirecting to login or refreshing token")
        }

        // Handle other common errors
        if (error.response?.status === 403) {
             console.warn("Forbidden access")
        }

        if (error.response?.status === 500) {
            console.error("Server error")
        }

        return Promise.reject(error)
    }
)
