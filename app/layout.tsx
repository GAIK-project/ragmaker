import "./global.css"

export const metadata = {
    title: "Ragmaker",
    description: "Create your own AI assistant with Ragmaker"
}

const RootLayout = ({children}) => {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}

export default RootLayout