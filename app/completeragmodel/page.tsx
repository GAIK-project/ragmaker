"use client"
import Image from "next/image"
import logo from './../assets/naama.png'
import { useChat } from "ai/react"
import { Message } from "ai"
import Bubble from "./../components/Bubble"
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingBubble from "./../components/LoadingBubble"
import PromptSuggestionRow from "./../components/PromptSuggestionRow"

interface AssistantData {
    assistantName: string,
    prompt: string,
    _id: any,
    timestamp: any,
    taskCompleted: boolean
}

const Home = () => {
    const [assistantData, setAssistantData] = useState<null | AssistantData>(null);
    const searchParams = useSearchParams();
    const assistantId = searchParams.get("assistantId");

    useEffect(() => {
        if (assistantId) {
            fetch(`/api/getAssistant?assistantId=${assistantId}`)
                .then((res) => res.json())
                .then((data) => setAssistantData(data.data));
        }
    }, [assistantId]);

    const { append, isLoading, messages, input, handleInputChange, handleSubmit } = useChat({ body: { assistantId } })

    const noMessages = !messages || messages.length === 0;

    const handlePrompt = ( promptText : string ) => {
        const msg : Message = {
            id: crypto.randomUUID(),
            content: promptText,
            role: "user"
        }
        append(msg)
    }

    return (
        <main>
            <Image src={logo} width="250" alt="logo"/>
            <section className={noMessages ? "" : "populated"}>
                {noMessages ? (
                    <>
                        <p className="starter-text">
                            {assistantData ? assistantData.assistantName : "Test assistant"}
                        </p>
                        <br/>
                        {/* <PromptSuggestionRow onPromptClick={handlePrompt}/> */}
                    </>
                ) : (
                    <>
                        {messages.map((message, index) => <Bubble key={`message-${index}`} message={message}/>)}
                        {isLoading && <LoadingBubble/>}
                    </>
                )
                }

            </section>
            <form onSubmit={handleSubmit}>
                    <input className="question-box" onChange={handleInputChange} value={input} placeholder="Ask me anything..."/>
                    <input type="submit"/>
            </form>
        </main>
    )
}

export default Home