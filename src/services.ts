import axios from "axios";
import SparkMD5 from "spark-md5"

export const Apis = {
    "/api/v1/tasks/run": "/api/v1/tasks/run",
    "/api/v1/tasks/runasync": "/api/v1/tasks/runasync",
    "/api/v1/tasks/query": "/api/v1/tasks/query",
    "/api/v1/tasks/plugin/runasync": "/api/v1/tasks/plugin/runasync",
    "/api/v1/agents/get": "/api/v1/agents/get",
    "/api/v1/agents/installpackage": "/api/v1/agents/installpackage",
    "/api/v1/users/register": "/api/v1/users/register",
    "/api/v1/users/login": "/api/v1/users/login",
    "/api/v1/spaces/get": "/api/v1/spaces/get",
    "/api/v1/spaces/addDirectory": "/api/v1/spaces/addDirectory",
    "/api/v1/spaces/addFile": "/api/v1/spaces/addFile",
    "/api/v1/spaces/delete": "/api/v1/spaces/delete",
    "/api/v1/spaces/clear": "/api/v1/spaces/clear",
    "/api/v1/iostorage/upload": "/api/v1/iostorage/upload",
    "/api/v1/iostorage/download": "/api/v1/iostorage/download",
    "/api/v1/iostorage/get": "/api/v1/iostorage/get",
    "/api/v1/package/contains": "/api/v1/package/contains",
    "/api/v1/package/upgrade": "/api/v1/package/upgrade",
    "/api/v1/package/get": "/api/v1/package/get",
    "/api/v1/package/all": "/api/v1/package/all",
    "/api/v1/package/list": "/api/v1/package/list",
    "/api/v1/package/query": "/api/v1/package/query"
}

const apiAddress = window.location.host;

const formatApiUrl = (url: string) => {
    // return `https://${apiAddress}${url}`;
    return url;
}

export interface TaskInterface {
    Input: { [key: string]: any }, //输入数据
    Output: any, //输出数据
    Processor: {
        Type: "Plugin", //指定插件来处理任务
        Name: "demo" //插件的名称
    },
    Trace?: {
        Message: "",
        ErrorLogger: [],
        InfoLogger: [],
    }
}

export interface SpaceNodeInterface {
    key: string,
    DataUri: string,
    ModifiedTime: string,
    ContentLength: number,
    Children?: SpaceNodeInterface[]
}

export interface PackageInterface {
    Name: string,
    Version: string,
    Author: string,
    Description: string,
    DataUri: string,
    Agents?: string[]
}

export enum VersionFlag {
    Major = 0,
    Minor = 1,
    Build = 2,
    Revision = 3
}

export interface CPUProcessorInterface {
    ProcessorTimePercent: number
}

export interface PerformanceInterface {
    TotalProcessorTimePercent: number,
    ProcessorCount: number,
    MemoryAvailableBytes: number,
    CommittedBytesInUsePercent: number,
    Processors: CPUProcessorInterface[]
}

export interface PluginInterface {
    Name: string,
    Enable?: boolean,
    DisplayName?: string,
    Description?: string,
    Version?: string,
    Author?: string,
    Type?: string,
    Entry: string,
    Timeout?: number,
}

export interface AgentInterface {
    ID: string,
    HostName: string,
    Performance?: PerformanceInterface | null,
    Plugins: PluginInterface[]
}

const Util = {
    calculateFileMD5: (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            // 使用 FileReader 读取文件内容  
            reader.readAsArrayBuffer(file);

            reader.onload = (e) => {
                const buffer = e.target?.result;
                if (buffer) {
                    // 判断buffer是string还是ArrayBuffer
                    if (buffer instanceof ArrayBuffer) {
                        const md5 = SparkMD5.ArrayBuffer.hash(buffer);
                        resolve(md5);
                    } else {
                        // buffer 是 string
                        const md5 = SparkMD5.hash(buffer);
                        resolve(md5);
                    }
                } else {
                    reject('Failed to read file');
                }
            };

            reader.onerror = () => {
                reject('Failed to read file');
            };
        });
    }
}

export const VizGroupService = {
    //当前用户的key
    Session: {
        getUserName: () => localStorage.getItem("username") || "",
        setUserName: (username: string) => localStorage.setItem("username", username),
        getToken: () => localStorage.getItem("token") || "",
        setToken: (token: string) => localStorage.setItem("token", token),
        getCurrentPath: () => {
            let currentPath = localStorage.getItem("currentPath");
            if (!currentPath) {
                return VizGroupService.Session.getUserName();
            }
            var userKey = currentPath.split("/")[0];
            if (userKey !== VizGroupService.Session.getUserName()) {
                return VizGroupService.Session.getUserName();
            }
            return currentPath;
        },
        setCurrentPath: (path: string) => localStorage.setItem("currentPath", path)
    },
    Tasks: {
        Run: async (pluginName: string, input: { [key: string]: any }, onProgress: (progress: any) => void) => {
            let runAsync = new Promise<TaskInterface>((resolve, reject) => {

                axios.post(formatApiUrl(Apis["/api/v1/tasks/plugin/runasync"]), input, {
                    params: {
                        pluginName: pluginName
                    },
                    headers: {
                        token: VizGroupService.Session.getToken()
                    }
                }).then((res: any) => {
                    if (res.data.success) {
                        resolve(res.data.data);
                    }
                    else {
                        reject(res);
                    }
                }).catch(reject)
            });
            let task_id = await runAsync;
            let subscribeProgress = new Promise<void>((resolve, reject) => {
                // 建立websocket连接，订阅
                let ws = new WebSocket(`${location.protocol.includes("s") ? "wss" : "ws"}://${apiAddress}/`);
                ws.onopen = () => {
                    ws.send(JSON.stringify({
                        task_id: task_id,
                        url: "/api/v1/tasks/subscribeprogress",
                        token: VizGroupService.Session.getToken()
                    }));
                }
                ws.onmessage = (event) => {
                    let data = JSON.parse(event.data);
                    if (data.progress) {
                        onProgress(data.progress);
                    }
                }
                ws.onclose = () => {
                    resolve();
                }
            });
            await subscribeProgress;
            let response = await axios.get(formatApiUrl(Apis["/api/v1/tasks/query"]), {
                params: {
                    id: task_id
                },
                headers: {
                    token: VizGroupService.Session.getToken()
                }
            });
            if (response.data.success) {
                return response.data.data as TaskInterface
            }
            else {
                throw new Error(response.data.message)
            }
        },
        Query: async (task_id: string) => {
            return new Promise<TaskInterface>((resolve, reject) => {
                axios.get(formatApiUrl(Apis["/api/v1/tasks/query"]), {
                    params: {
                        task_id: task_id
                    },
                    headers: {
                        token: VizGroupService.Session.getToken()
                    }
                }).then((res: any) => {
                    if (res.data.success) {
                        resolve(res.data.data);
                    }
                    else {
                        reject(res);
                    }
                }).catch(reject)
            })
        },
        RunSync: async (pluginName: string, input: { [key: string]: any }) => {
            let response = await axios.post(formatApiUrl(Apis["/api/v1/tasks/run"]), {
                Input: input,
                Processor: {
                    "Name": pluginName,
                    "Type": "Plugin"
                }
            }, {
                headers: {
                    token: VizGroupService.Session.getToken()
                }
            });
            if (response.status == 200) {
                if (response.data.success) {
                    return response.data.data as TaskInterface;
                }
                else {
                    throw response.data.message ?? "Unkown error";
                }
            }
            else {
                throw "Net error"
            }
        },
    },
    Users: {
        Register: async (username: string, password: string) => {
            const secret = SparkMD5.hash(password)
            return new Promise<any>((resolve, reject) => {
                axios.get(formatApiUrl(Apis["/api/v1/users/register"]), {
                    params: {
                        username: username,
                        secret: secret
                    }
                }).then((res: any) => {
                    if (res.data.success) {
                        resolve(res.data.data);
                    }
                    else {
                        reject(res);
                    }
                }).catch(reject)
            });
        },
        Login: async (username: string, password: string): Promise<string> => {
            const secret = SparkMD5.hash(password).toString()
            return new Promise<string>((resolve, reject) => {
                axios.get(formatApiUrl(Apis["/api/v1/users/login"]), {
                    params: {
                        username: username,
                        secret: secret
                    }
                }).then((res: any) => {
                    if (res.data.success) {
                        resolve(res.data.data);
                    }
                    else {
                        reject(res);
                    }
                }).catch(reject)
            });
        }
    },
    IOStroage: {
        Upload: async (file: File) => {
            // 计算文件内容的MD5
            const fileName = file.name;
            const contentMD5 = await Util.calculateFileMD5(file);
            const fileMD5 = SparkMD5.hash(file.name + contentMD5);
            return new Promise<string>((resolve, reject) => {
                axios.post(formatApiUrl(Apis["/api/v1/iostorage/upload"]), file, {
                    params: {
                        fileName: fileName,
                        fileMD5: fileMD5,
                        contentMD5: contentMD5,
                    },
                    headers: {
                        token: VizGroupService.Session.getToken()
                    }
                }).then((res: any) => {
                    if (res.data.success) {
                        resolve(res.data.data);
                    }
                    else {
                        reject(res);
                    }
                }).catch(reject)
            });
        },
        UploadString: async (fileName: string, content: string) => {
            const contentMD5 = SparkMD5.hash(content);
            const fileMD5 = SparkMD5.hash(fileName + contentMD5);
            return new Promise<string>((resolve, reject) => {
                axios.post(formatApiUrl(Apis["/api/v1/iostorage/upload"]), content, {
                    params: {
                        fileName: fileName,
                        fileMD5: fileMD5,
                        contentMD5: contentMD5,
                    },
                    headers: {
                        token: VizGroupService.Session.getToken()
                    }
                }).then((res: any) => {
                    if (res.data.success) {
                        resolve(res.data.data);
                    }
                    else {
                        reject(res);
                    }
                }).catch(reject)
            });
        }
    },
    Spaces: {
        Get: async (key: string) => {
            return new Promise<SpaceNodeInterface>((resolve, reject) => {
                axios.get(formatApiUrl(Apis["/api/v1/spaces/get"]), {
                    params: {
                        key: key,
                    },
                    headers: {
                        token: VizGroupService.Session.getToken()
                    }
                }).then((res: any) => {
                    if (res.data.success) {
                        resolve(res.data.data);
                    }
                    else {
                        reject(res);
                    }
                }).catch(reject)
            });
        },
        AddDirectory: async (key: string, name: string) => {
            return new Promise<void>((resolve, reject) => {
                axios.get(formatApiUrl(Apis["/api/v1/spaces/addDirectory"]), {
                    params: {
                        key: key,
                        name: name
                    },
                    headers: {
                        token: VizGroupService.Session.getToken()
                    }
                }).then((res: any) => {
                    if (res.data.success) {
                        resolve(res.data.data);
                    }
                    else {
                        reject(res);
                    }
                }).catch(reject)
            });
        },
        AddFile: async (key: string, file: File) => {
            // 先尝试上传文件
            let fileId = await VizGroupService.IOStroage.Upload(file);
            return new Promise<void>((resolve, reject) => {
                axios.get(formatApiUrl(Apis["/api/v1/spaces/addFile"]), {
                    params: {
                        key: key,
                        name: file.name,
                        uri: `/api/v1/iostorage/download/${fileId}`
                    },
                    headers: {
                        token: VizGroupService.Session.getToken()
                    }
                }).then((res: any) => {
                    if (res.data.success) {
                        resolve(res.data.data);
                    }
                    else {
                        reject(res);
                    }
                }).catch(reject)
            });
        },
        Delete: async (key: string) => {
            return new Promise<void>((resolve, reject) => {
                axios.get(formatApiUrl(Apis["/api/v1/spaces/delete"]), {
                    params: {
                        key: key
                    },
                    headers: {
                        token: VizGroupService.Session.getToken()
                    }
                }).then((res: any) => {
                    if (res.data.success) {
                        resolve(res.data.data);
                    }
                    else {
                        reject(res);
                    }
                }).catch(reject)
            });
        },
        AddFileByString: async (key: string, fileName: string, content: string) => {
            // 先尝试上传文件
            let fileId = await VizGroupService.IOStroage.UploadString(fileName, content);
            return new Promise<void>((resolve, reject) => {
                axios.get(formatApiUrl(Apis["/api/v1/spaces/addFile"]), {
                    params: {
                        key: key,
                        name: fileName,
                        uri: `/api/v1/iostorage/download/${fileId}`
                    },
                    headers: {
                        token: VizGroupService.Session.getToken()
                    }
                }).then((res: any) => {
                    if (res.data.success) {
                        resolve(res.data.data);
                    }
                    else {
                        reject(res);
                    }
                }).catch(reject)
            });
        },
        Clear: async (key: string) => {
            await axios.get(formatApiUrl(Apis["/api/v1/spaces/clear"]), {
                params: {
                    key: key
                },
                headers: {
                    token: VizGroupService.Session.getToken()
                }
            });
        }
    },
    Package: {
        Contains: async (name: string) => {
            let res = await axios.get(formatApiUrl(Apis["/api/v1/package/contains"]), {
                params: {
                    name: name
                },
                headers: {
                    token: VizGroupService.Session.getToken()
                }
            })
            let msg = res.data;
            if (msg.success) {
                return msg.data;
            }
            else {
                throw new Error(msg.message);
            }
        },
        Upgrade: async (name: string, description: string, dataUri: string, versionFlag: VersionFlag) => {
            let res = await axios.get(formatApiUrl(Apis["/api/v1/package/upgrade"]), {
                params: {
                    name: name,
                    description: description,
                    dataUri: dataUri,
                    versionFlag: versionFlag
                },
                headers: {
                    token: VizGroupService.Session.getToken()
                }
            })
            let msg = res.data;
            if (msg.success) {
                return msg.data as PackageInterface;
            }
            else {
                throw new Error(msg.message);
            }
        },
        List: async (name: string) => {
            let res = await axios.get(formatApiUrl(Apis["/api/v1/package/list"]), {
                params: {
                    name: name
                },
                headers: {
                    token: VizGroupService.Session.getToken()
                }
            })
            let msg = res.data;
            if (msg.success) {
                return msg.data as PackageInterface[];
            }
            else {
                throw new Error(msg.message);
            }
        },
        All: async () => {
            let res = await axios.get(formatApiUrl(Apis["/api/v1/package/all"]), {
                headers: {
                    token: VizGroupService.Session.getToken()
                }
            })
            let msg = res.data;
            if (msg.success) {
                return msg.data as PackageInterface[];
            }
            else {
                throw new Error(msg.message);
            }
        },
        Get: async (name: string) => {
            let res = await axios.get(formatApiUrl(Apis["/api/v1/package/get"]), {
                params: {
                    name: name
                },
                headers: {
                    token: VizGroupService.Session.getToken()
                }
            })
            let msg = res.data;
            if (msg.success) {
                return msg.data as PackageInterface;
            }
            else {
                throw new Error(msg.message);
            }
        },
        Query: async (names: string[]) => {
            let res = await axios.post(formatApiUrl(Apis["/api/v1/package/query"]), {
                names: names
            }, {
                headers: {
                    token: VizGroupService.Session.getToken()
                }
            })
            let msg = res.data;
            if (msg.success) {
                return msg.data as PackageInterface[];
            }
            else {
                throw new Error(msg.message);
            }
        }
    },
    Agents: {
        Get: async () => {
            let res = await axios.get(formatApiUrl(Apis["/api/v1/agents/get"]), {
                headers: {
                    token: VizGroupService.Session.getToken()
                }
            });
            let msg = res.data;
            if (msg.success) {
                return msg.data as AgentInterface[];
            }
            else {
                throw new Error(msg.message);
            }
        },
        InstallPackage: async (agentId: string, packageName: string) => {
            let res = await axios.get(formatApiUrl(Apis["/api/v1/agents/installpackage"]), {
                params: {
                    agentId: agentId,
                    packageName: packageName
                },
                headers: {
                    token: VizGroupService.Session.getToken()
                }
            });
            let msg = res.data;
            if (msg.success) {
                return msg.data;
            }
            else {
                throw new Error(msg.message);
            }
        }
    }
}