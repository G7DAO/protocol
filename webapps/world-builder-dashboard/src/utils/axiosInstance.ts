import Axios from 'axios'

const axiosInstance = Axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-type': 'application/json'
  }
})

axiosInstance.defaults.withCredentials = true

export default axiosInstance
