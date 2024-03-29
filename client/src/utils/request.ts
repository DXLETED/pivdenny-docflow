import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import { authActions } from 'store/auth'

const Axios = axios.create({ baseURL: process.env.REACT_APP_BASE_URL })

interface Req {
  res: (res: AxiosResponse) => void
  rej: (res: AxiosError) => void
  config: AxiosRequestConfig
  thunkAPI: any
  withToken: boolean
}

class Request {
  constructor() {
    return Request._instance || this
  }
  static _instance: Request
  queue: Req[] = []
  isRefreshing: boolean = false
  async withoutToken<T>(config: AxiosRequestConfig): Promise<T> {
    return await this.create(config, null)
  }
  async withToken<T>(config: AxiosRequestConfig, thunkAPI: any): Promise<T> {
    try {
      return await this.create(config, thunkAPI, { withToken: true })
    } catch (err) {
      if (err.response?.status === 401) {
        !this.isRefreshing && (await this.refreshTokens(thunkAPI))
        return this.create(config, thunkAPI, { withToken: true })
      }
      if (err.response?.status === 403) this.logout(thunkAPI)
      throw err
    }
  }
  private async refreshTokens(thunkAPI: any) {
    if (this.isRefreshing) return
    const req = this.create(
      {
        method: 'POST',
        url: `${process.env.REACT_APP_API_URL}/auth/refresh`,
        data: { refreshToken: thunkAPI.getState().auth.refreshToken },
      },
      thunkAPI
    )
    this.isRefreshing = true
    try {
      const result = await req
      thunkAPI.dispatch(authActions.set(result))
      this.queue.forEach(req => this.makeRequest(req))
    } catch (err) {
      this.logout(thunkAPI)
      this.queue.forEach(req => req.rej(err))
    } finally {
      this.isRefreshing = false
    }
  }
  private create(config: AxiosRequestConfig, thunkAPI: any, { withToken = false } = {}) {
    return new Promise((res: (res: any) => void, rej: (res: AxiosError) => void) => {
      const req = { config, res, rej, thunkAPI, withToken }
      this.isRefreshing ? this.queue.push(req) : this.makeRequest(req)
    })
  }
  private async makeRequest(req: Req) {
    const { res, rej, config, thunkAPI, withToken } = req
    try {
      const result = await Axios.request({
        ...config,
        headers: withToken
          ? { authorization: `Bearer ${thunkAPI.getState().auth.accessToken}`, ...config.headers }
          : config.headers,
      })
      res(result.data)
    } catch (e) {
      rej(e)
    }
    this.queue = this.queue.filter(rq => rq !== req)
  }
  private logout(thunkAPI: any) {
    thunkAPI.dispatch(authActions.reset())
  }
}

export const request = new Request()
