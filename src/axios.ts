import axios from "axios"


const BASE_URL = "https://bxr7npxtudmm55cosert6cpphu0wvjyq.lambda-url.eu-west-1.on.aws/";

interface LoginResponse {
    token: string;
}

interface LoginResult {
    successful: boolean
    token: string | undefined;
    displayMessage: string;
}


interface QueryResponse {
    files: string[];
    pages: number[];
    answer: string;
}

interface QueryResult {
    files: string[] | undefined
    pages: number[] | undefined
    text: string
}

export async function login(username: string, password: string) : Promise<LoginResult | undefined> {
    try {
        const response = await axios.post<LoginResponse>(
            BASE_URL + "login",
            {username: username, password: password}
        )
        if (
            response.data
            && "token" in response.data && typeof(response.data.token) === "string"
        ) {
            return {successful: true, token: response.data.token, displayMessage: ""}
        } else {
            throw new Error("Invalid response body");
        }
    } catch (e) {
        if (axios.isAxiosError(e)) {
            if (e.response !== undefined) {
                return {successful: false, token: undefined, displayMessage: e.response.data.detail};
            }
            return {successful: false, token: undefined, displayMessage: "Unknown AxiosError"};
        } else {
            console.log(e);
            return {successful: false, token: undefined, displayMessage: "Unknown error, check logs for more details"};
        }
    }
}

export async function getResponse(message: string, token: string | undefined) : Promise<QueryResult | undefined> {
    try {
        if (typeof(token) === "undefined") {
            throw Error("Error: Token not defined");
        }

        const response = await axios.post<QueryResponse>(
            BASE_URL + "get-answer",
            {query: message},
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        )

        if (
            response.data
            && "files" in response.data && Array.isArray(response.data.files) && response.data.files.every(item => typeof(item) === "string")
            && "pages" in response.data && Array.isArray(response.data.pages) && response.data.pages.every(item => typeof(item) === "number")
            && response.data.files.length === response.data.pages.length
            && "answer" in response.data && typeof(response.data.answer) === "string"
        ) {
            const context = new Map();
            for (let i = 0; i < response.data.files.length; i++) {
                context.set(response.data.files[i], response.data.pages[i]);
            }

            if (response.data.files.length === 0) {
                return {files: undefined, pages: undefined, text: response.data.answer};
            }
            return {files: response.data.files, pages: response.data.pages, text: response.data.answer};
        } else {
            throw new Error("Invalid response body");
        }
    } catch (e) {
        console.error(e);
        if (axios.isAxiosError(e)) {
            if (e.status === 403) {
                return {files: undefined, pages: undefined, text: "Session expired, please log in again"};
            }
            return {files: undefined, pages: undefined, text: "Error: Check logs for more details"};
        }
    }
}