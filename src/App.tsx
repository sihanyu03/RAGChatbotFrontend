import { useState, useEffect } from 'react'
import {getResponse} from "./axios.ts";
import {login} from "./axios.ts";
import Typewriter from "react-typewriter-effect";
import './index.css'

interface Message {
    files: string[] | undefined
    pages: number[] | undefined
    text: string | undefined
    isUser: boolean
}

function App() {
    const [input, setInput] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([])
    const [token, setToken] = useState<string | undefined>(undefined);
    const [usernameInput, setUsernameInput] = useState<string>("");
    const [passwordInput, setPasswordInput] = useState<string>("");
    const [loginDisplayInfo, setLoginDisplayInfo] = useState<string | undefined>("");

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (token) {
            setToken(token);
        }
    }, []);

    const onLogin = async () => {
        if (usernameInput.trim() === "") {
            setLoginDisplayInfo("Username field cannot be empty");
        } else if (passwordInput.trim() === "") {
            setLoginDisplayInfo("Password field cannot be empty");
        } else {
            const response = await login(usernameInput, passwordInput);
            if (response?.successful === true) {
                setToken(response?.token);
                if (typeof response?.token === "string") {
                    sessionStorage.setItem("token", response?.token);
                }
            } else {
                setLoginDisplayInfo(response?.displayMessage);
            }
        }
    }

    const onLogout = () => {
        setInput("");
        setIsLoading(false);
        setMessages([]);
        setToken(undefined);
        setUsernameInput("");
        setPasswordInput("");
        setLoginDisplayInfo("");
        sessionStorage.removeItem("token");
    }

    const sendMessage = async() => {
        if (input.trim() === "") {
            return;
        }
        setInput("");
        setIsLoading(true);

        setMessages((prevMessages) => [
            ...prevMessages,
            {files: undefined, pages: undefined, text: input, isUser: true}
        ])
        const response = await getResponse(input, token);
        setMessages((prevMessages) => [
            ...prevMessages,
            {files: response?.files, pages: response?.pages, text: response?.text, isUser: false}
        ])
        setIsLoading(false);
    }

    if (token === undefined) {
        return (
            <div className="flex items-center justify-center w-screen h-screen bg-gray-950 text-white">
                <div
                    className="w-96 h-80 bg-gray-800 rounded-lg object-center"
                    onKeyDown={(e) => {if (e.key === "Enter") onLogin();}}
                >
                    <p className="p-3 text-center text-white">
                        Log in <span className="text-red-500">{loginDisplayInfo}</span>
                    </p>
                    <p className="text-left pl-5 text-white">Username:</p>
                    <div className="p-3 flex items-center justify-center">
                        <input
                            type="text"
                            value={usernameInput}
                            onChange={(e) => setUsernameInput(e.target.value)}
                            placeholder="Username"
                            className="flex-grow p-3 rounded-full bg-gray-950"
                        />
                    </div>
                    <p className="text-left pl-5 text-white">Password: {token}</p>
                    <div className="p-3 flex items-center justify-center">
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="Password"
                            className="flex-grow p-3 rounded-full bg-gray-950"
                        />
                    </div>
                    <div
                        className="flex p-3 items-center justify-center"
                    >
                        <button
                            onClick={onLogin}
                            className={`flex px-4 py-2 w-96 items-center justify-center rounded-full ${
                                isLoading ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-green-500 hover:bg-green-600 text-white"
                            }`}
                        >
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2"/>
                            ) : "Sign in"}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[100vh] w-[100vw] bg-gray-950 text-white">
            <button
                className="w-40 ml-4 mt-4 rounded-full bg-red-500"
                onClick={onLogout}
            >
                Log out
            </button>
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.map((message, idx1) => (
                    <div key={idx1}
                         className={`flex flex-col space-y-4 ${message.isUser ? "justify-end" : "justify-start"}`}>
                        {!message.isUser && message.files != undefined && message.pages != undefined && message.files.length === message.pages.length ? (
                            <div
                                className={"p-3 rounded-2xl break-words max-w-[80%] bg-gray-700 text-white self-start"}>
                                <div>Context:</div>
                                <div>
                                    {message.files.map((file, idx2) => (
                                        message.pages !== undefined && message.pages[idx2] !== undefined ?
                                        <div key={idx2}>
                                            <Typewriter text={`File: ${file}, Page: ${message.pages[idx2]}`} typeSpeed={1} cursorColor="transparent"/>
                                        </div>
                                        : null
                                    ))}
                                </div>
                            </div>
                        ) : null}
                        <div className={`p-3 rounded-2xl break-words max-w-[80%] ${
                            message.isUser ? "bg-green-500 text-white self-end"
                                : "bg-gray-700 text-white self-start"
                        }`}>
                            {message.isUser && message.text}
                            {!message.isUser &&
                                <div>
                                    {
                                        message.text !== undefined ?
                                        message.text.split("\n").map((line, idx3) => (
                                        <div key={idx3}>
                                            <Typewriter text={line} typeSpeed={1} cursorColor="transparent"/>
                                        </div>
                                        ))
                                        : null
                                    }
                                </div>
                            }
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-4 flex"
                 onKeyDown={(e) => {
                     if (e.key === "Enter") sendMessage();
                 }}
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Message Chatbot..."
                    className="flex-grow p-3 rounded-full bg-gray-800"
                />
                <button
                    onClick={sendMessage}
                    className={`px-4 py-2 rounded-full ${
                        isLoading ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                >
                    {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2"/>
                    ) : "↑"}
                </button>
            </div>
        </div>
    )
}

export default App
