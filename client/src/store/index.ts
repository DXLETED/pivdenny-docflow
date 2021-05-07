import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { saveState } from 'utils/localStorage'
import { authReducer } from './auth'
import { blanksReducer } from './blanks'

export const store = configureStore({ reducer: combineReducers({ auth: authReducer, blanks: blanksReducer }) })

export type RootState = ReturnType<typeof store.getState>
export type RootDispatch = typeof store.dispatch

store.subscribe(() => saveState('auth', store.getState().auth))
