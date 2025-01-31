import "./global.css"

export const metadata = {
    title: "f1GPT",
    description: "The place for all of your f1 info"
}

const RootLayout = ({children}) => {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}

export default RootLayout