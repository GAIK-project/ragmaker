"use client";
import { useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { BiError } from 'react-icons/bi';
import AutoGrowingTextarea from "./components/AutoTextarea";
import "./styles/frontpage.css";

export default function Home() {
    const [assistantName, setAssistantName] = useState<string>("");
    const [systemPrompt, setSystemPrompt] = useState<string>("");
    const [links, setLinks] = useState<string[]>([""]);
    const [isButtonEnabled, setIsButtonEnabled] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [processCompleted, setProcessCompleted] = useState<boolean>(false);

    const handleSystemPromptChange = (e) => {
        setSystemPrompt(e.target.value);
        validateForm(e.target.value, links);
    };

    const handleLinkChange = (index : number, value : string) => {
        const updatedLinks = [...links];
        updatedLinks[index] = value;
        setLinks(updatedLinks);
        validateForm(systemPrompt, updatedLinks);
    };

    const handleNameChange = (value : string) => {
        setAssistantName(value);
    };

    const addLinkField = () => {
        setLinks([...links, ""]);
    };

    const validateForm = (prompt : string, linksArray : string[]) => {

        if (assistantName.trim() === "") {
            setErrorMessage("Name for the assistant cannot be empty.");
            setIsButtonEnabled(false);
            return;
        }

        if (prompt.trim() === "") {
            setErrorMessage("Instructions for the assistant cannot be empty.");
            setIsButtonEnabled(false);
            return;
        }

        for (let i = 0; i < linksArray.length; i++) {
            if (linksArray[i].trim() === "") {
                setErrorMessage(`Link ${i + 1} cannot be empty.`);
                setIsButtonEnabled(false);
                return;
            }
            if (!/^https?:\/\/.+/.test(linksArray[i])) {
                setErrorMessage(`Link ${i + 1} must start with "http://" or "https://".`);
                setIsButtonEnabled(false);
                return;
            }
        }

        setErrorMessage(""); // Clear error message if everything is valid
        setIsButtonEnabled(true);
    };

    const handleSubmit = async () => {
        let check : boolean =  await checkUniqueName(assistantName);
        if(check){
            setErrorMessage("Assistant name already exists, please select a new one");
            return;
        }

        const payload = {
            assistantName,
            systemPrompt,
            links,
        };

        setLoading(true);
        setIsButtonEnabled(false);

        try {
            const response = await fetch("/api/saveModelData", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                checkStatus();
                console.log("Data sent successfully!");
            } else {
                console.error("Failed to send data.");
            }
        } catch (error) {
            console.error("Error occurred while sending data:", error);
        }
    };

    async function checkUniqueName(name : string) {
        console.log("Checking name: ", name);
        const res = await fetch(`/api/checkUniqueName?assistantId=${name}`);
        const data = await res.json();

        if(data.unique){
            console.log("Name already exists");
            return true;
        }
        console.log("Name is free to take");
        return false;
    }

    async function checkStatus() {
        const interval = setInterval(async () => {
          const res = await fetch(`/api/checkTaskStatus?assistantId=${assistantName}`);
          const data = await res.json();
          setProcessCompleted(data.taskCompleted);
    
          if (data.taskCompleted) {
            clearInterval(interval);
            setLoading(false);
          }
        }, 10000); // Poll every 10 seconds
    }

    async function testDb() {
        const res = await fetch(`/api/testDb`);
        const data = await res.json();
    }

    return (
        <div className="container">
            <Head>
                <title>Create RAG Model</title>
            </Head>
            <div className="welcome-section faded-shadow">
                <div className="welcome-text">Create your own AI assistant</div>
                <div className="welcome-subtitle">
                    Define instructions for your assistant and add links as context, so the assistant can fetch answers from the given context!
                </div>
            </div>

            <div className="section">
                    <h2 className="titles">Name for your new assistant</h2>
                    <input 
                        className="input"
                        type="text"
                        maxLength={20}
                        value={assistantName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Formulasensei" 
                    />
                </div>

            <div className="centered-section">
                <div className="section">
                    <h2 className="titles">Instructions (system prompt)</h2>
                    <AutoGrowingTextarea value={systemPrompt} onChange={handleSystemPromptChange} placeholder='You are an AI assistant who knows everything about Formula One.'/>
                </div>

                <div className="section">
                    <h2 className="titles">Links</h2>
                    {links.map((link, index) => (
                        <div key={index} className="link-field-container">
                            <input
                                className="input"
                                type="text"
                                maxLength={200}
                                value={link}
                                onChange={(e) => handleLinkChange(index, e.target.value)}
                                placeholder={(index === 0) ? 'https://en.wikipedia.org/wiki/Formula_One' : `Link ${index + 1}`}
                            />
                            <button
                                className="delete-button"
                                onClick={() => {
                                    const updatedLinks = links.filter((_, i) => i !== index);
                                    setLinks(updatedLinks);
                                    validateForm(systemPrompt, updatedLinks);
                                }}
                            >
                            X
                            </button>
                        </div>
                    ))}
                    <button className="add-button" onClick={addLinkField}>
                        Add Another Link
                    </button>
                </div>

                {errorMessage && <div style={{display: "flex", flexDirection: 'row'}}>
                                    <div className="error-message">
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <BiError size={24} style={{ marginRight: '8px' }} />
                                        <span>{errorMessage}</span>
                                        </div>
                                    </div>
                                 </div>
                }

                {(loading &&
                    <div className="loader-container">
                        <p className="loader-text">Data is being collected from the provided links and prepared to a form your AI assistant can understand... This might take several minutes depending on your data size</p>
                        <div className="loader"></div>
                    </div>
                )}

                <div className="button-container">
                    <button
                        className="create-button"
                        disabled={!isButtonEnabled}
                        onClick={handleSubmit}
                    >
                        Create Your Own RAG Model
                    </button>
                </div>

                {(processCompleted &&
                    <Link href={`/completeragmodel?assistantId=${assistantName}`}>
                        <button
                            className="create-button"
                        >
                            See your new AI assistant!
                        </button>
                    </Link>
                )}
                {/*
                    <button
                        className="create-button"
                        onClick={() => testDb()}
                    >
                        test
                     </button> */}
            </div>
        </div>
    );
}
