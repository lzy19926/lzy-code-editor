/*
 * @Author: Luzy
 * @Date: 2023-08-22 11:36:46
 * @LastEditors: Luzy
 * @LastEditTime: 2023-09-08 11:06:25
 * @Description: 运行在主进程中的IPC通信模块  用于接收子进程的服务请求  或者转发子进程消息给其他子进程
 * 通过IPC模块进行通信 以替代网络通信
 */
import { ipcMain } from "electron"
import { createDecorator } from '../common/IOC/decorator'
import { registerSingleton } from '../common/IOC/serviceCollection'
import { apiFactory, LZY_API } from "../common/api/apiFactory"

export class IPCMainService {

    API!: LZY_API

    constructor() {
        this.API = apiFactory()
        this.listen()
    }

    listen() {
        this.listenAPI()
        this.listenProxy()

        console.log("[[IPC Main started]]")
    }

    // 处理API调用请求
    listenAPI() {
        const API = this.API

        // invoke和handle两个API用于实现ipc的网络请求格式
        // https://www.electronjs.org/zh/docs/latest/api/ipc-renderer#ipcrendererinvokechannel-args
        ipcMain.handle('API', async (event, arg) => {
            console.log('receve message', arg)
            const { api, params } = arg

            let res;
            switch (api) {
                case "readFileTextSync": res = API.readFileTextSync(params.path)
                    break;
                case "readFileBufferSync": res = API.readFileBufferSync(params.path)
                    break;
                case "writeFileTextSync": res = API.writeFileTextSync(params.path, params.text)
                    break;
                case "getFileTreeFromDir": res = API.getFileTreeFromDir()
                    break;
                case "createTerminal": res = API.createTerminal()
                    break;
                default:
            }

            return res
        })
    }

    // 处理需要转发到其他子进程消息
    listenProxy() {
        ipcMain.on('Proxy', (event, arg) => {
            console.log('receve message', arg)
        })
    }

}

export interface IIPCMainService { }

export const IIPCMainService = createDecorator<IIPCMainService>("IIPCMainService")
registerSingleton(IIPCMainService, IPCMainService)