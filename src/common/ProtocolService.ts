/*
 * @Author: Luzy
 * @Date: 2023-08-22 11:36:46
 * @LastEditors: Luzy
 * @LastEditTime: 2023-08-25 00:58:18
 * @Description: 提供内置协议管理的服务  浏览器-Node进程通信使用该协议
 */
import { protocol, app } from 'electron';
import { createDecorator } from './IOC/decorator'
import { getGlobalCollection, registerSingleton } from './IOC/serviceCollection'


export class ProtocolService {

    schemes: Set<string> = new Set()

    constructor() {
        this.setUp()
    }

    // 创建初始lzy协议
    private setUp() {
        this.createProtocolScheme('lzy')

        app.whenReady().then(() => {
            this.registAndStartScheme('lzy')
        })
    }

    // 首先创建schema
    private createProtocolScheme(scheme: string = "lzy") {
        protocol.registerSchemesAsPrivileged([
            {
                scheme,
                privileges: {
                    bypassCSP: true,
                    supportFetchAPI: true
                }
            }
        ])
    }

    // 将schema注册为可用
    // https://www.electronjs.org/zh/docs/latest/breaking-changes#protocolinterceptbufferprotocol
    private registAndStartScheme(scheme: string = "lzy") {

        // 注册scheme 并拦截改协议的请求
        protocol.registerStringProtocol(scheme, noob)
        protocol.interceptStringProtocol(scheme, useMVC)

        if (this.checkProtocolRegistered(scheme)) {
            this.schemes.add(scheme)
            console.log(`Scheme ${scheme} success in used`)
        }
    }

    // 检查协议是否注册
    private checkProtocolRegistered(scheme: string): boolean {
        return protocol.isProtocolRegistered(scheme)
    }
}

export interface IProtocolService { }

export const IProtocolService = createDecorator<IProtocolService>("IProtocolService")
registerSingleton(IProtocolService, ProtocolService)










//todo --------------是否需要将其规划成MVC架构？---待实现-- 先这样写---------


type ResCb = (response: string | Electron.ProtocolResponse) => void
type EReq = Electron.ProtocolRequest
const noob = () => { }

function useMVC(req: EReq, cb: ResCb) {
    router(req, cb, new Controller())
}

function router(req: EReq, cb: ResCb, c: Controller) {
    console.log(req);

    const { url } = req

    switch (url) {
        case "lzy://api/getFiles": c.getFiles(req, cb)
            break;
        case "lzy://api/getFileContent": c.getFileContent(req, cb)
            break;
        default:
    }
}








import { IFileService } from './FileService'


function getFileService(): IFileService {
    const services = getGlobalCollection()
    /**@ts-ignore*/
    const fileService: IFileService = services.get(IFileService)

    return fileService
}


class Controller {


    // 通过文件夹路径获取文件树
    getFiles(req: EReq, callback: ResCb) {

        const fileService = getFileService()

        fileService.getFileTreeFromDir().then(fileTree => {
            const response = {
                statusCode: 200,
                headers: { 'content-type': 'application/json' },
                data: JSON.stringify({ status: 200, data: fileTree })
            }

            callback(response)
        })


    }

    getFileContent(req: EReq, callback: ResCb) {

        console.log(req);

        const fileService = getFileService()
        const fileBuffer = fileService.getFileText("E:/VS_Code/myVSCode/src/main/main.ts")

        const response = {
            statusCode: 200,
            headers: { 'content-type': 'application/json' },
            data: JSON.stringify({ status: 200, data: fileBuffer })
        }

        callback(response)
    }

}

