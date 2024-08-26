import React, { createContext, useContext, useLayoutEffect, useReducer } from 'react'
import { User } from '@/types'
import axiosInstance from '@/utils/axiosInstance'

export const LOGOUT = 'LOGOUT'
export const LOGIN = 'LOGIN'

interface AuthState {
  isAuthenticated: boolean
  user: User | undefined
  login: (user: User) => void
  logout: () => void
}

interface Action {
  type: string
  payload: any
}

const StateContext = createContext<AuthState>({
  isAuthenticated: false,
  user: undefined,
  login: async () => {},
  logout: () => {}
})

const reducer = (state: AuthState, { type, payload }: Action) => {
  switch (type) {
    case LOGIN:
      return {
        ...state,
        isAuthenticated: true,
        user: payload
      }
    case LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null
      }
    default:
      return state
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, defaultDispatch] = useReducer(reducer, {
    user: null,
    isAuthenticated: false,
    login: async () => {},
    logout: () => {}
  })

  const dispatch = (type: string, payload?: any) => defaultDispatch({ type, payload })

  const loadUser = () => {
    const user = JSON.parse(localStorage.getItem('user') as any) as User
    if (!user) {
      logout()
    }
    if (user) {
      dispatch(LOGIN, user)
    }
  }
  useLayoutEffect(() => {
    axiosInstance.interceptors.response.use(
      (response) => {
        return response
      },
      (error) => {
        if (error.response.status === 401) {
          logout()
        }
        throw error
      }
    )
    loadUser()
  }, [])

  const login = (user: User) => {
    localStorage.setItem('user', JSON.stringify(user))
    dispatch(LOGIN, user)
  }

  const logout = () => {
    const user = localStorage.getItem('user')
    if (!user) return
    localStorage.removeItem('user')
    dispatch(LOGOUT)
  }

  return (
    <StateContext.Provider
      value={{
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        login,
        logout
      }}
    >
      {children}
    </StateContext.Provider>
  )
}

export const useAuthState = () => useContext(StateContext)
