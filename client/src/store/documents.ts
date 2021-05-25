import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { request } from 'utils/request'
import { RootState } from 'store'
import { Document } from './document'

export type DocumentsState = {
  list: Document[]
  isLoading: boolean
  loaded: boolean
  page: number | null
}

const initialState: DocumentsState = {
  list: [],
  isLoading: false,
  loaded: false,
  page: null,
}

export const getDocuments = createAsyncThunk(
  'documents/get',
  async ({ path, search }: { path: string, search?: string }, thunkAPI) => {
    const documents = (thunkAPI.getState() as RootState).documents
    if (documents.isLoading || documents.loaded) return
    thunkAPI.dispatch(slice.actions.setIsLoading(null))
    const page = documents.page !== null ? documents.page + 1 : 0
    const res = await request.withToken<{data: Document[], total: number}>(
      {
        method: 'GET',
        url: `${process.env.REACT_APP_API_URL}${path}`,
        params: { from: page * 10, to: page * 10 + 10, search },
      },
      thunkAPI
    )
    thunkAPI.dispatch(slice.actions.add({ list: res.data, total: res.total, page }))
    return res
  }
)

const slice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    add: (state, action) => {
      state.list.push(...action.payload.list)
      state.page = action.payload.page
      state.loaded = state.list.length >= action.payload.total
      state.isLoading = false
    },
    setIsLoading: (state, action) => {
      state.isLoading = true
    },
    loaded: (state, action) => {
      state.loaded = true
    },
    reset: () => initialState
  },
})

export const { reducer: documentsReducer, actions: documentsActions } = slice
