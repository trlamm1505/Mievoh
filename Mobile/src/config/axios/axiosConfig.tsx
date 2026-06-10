import axios from 'axios'
import { API_BASE_URL } from '../constant/constant'
import AsyncStorage from '@react-native-async-storage/async-storage'

const api = axios.create({
    baseURL: API_BASE_URL,
})

// Add request interceptor to automatically attach authorization header
api.interceptors.request.use(async (config) => {
    try {
        let token = await AsyncStorage.getItem('accessToken')
        if (token) {
            token = token.trim().replace(/^["']|["']$/g, '');
            if (config.headers) {
                // Set both standard headers for maximum compatibility
                config.headers.token = token
                config.headers.Authorization = `Bearer ${token}`
            }
        }
    } catch (e) {
        console.error('Error reading token from AsyncStorage', e)
    }
    return config
})

// Add response interceptor to automatically unwrap standard success wrapper from NestJS
api.interceptors.response.use(
    (response) => {
        // If NestJS success interceptor wrapped the result, unwrap it
        if (response.data && response.data.message === 'Success' && 'data' in response.data) {
            response.data = response.data.data
        }
        return response
    },
    (error) => {
        return Promise.reject(error)
    }
)

export default api
