import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar"
import { PageProps } from "@/types"
import { router, usePage } from "@inertiajs/react"
import { EyeClosedIcon, EyeIcon, SettingsIcon } from "lucide-react"
import { useState } from "react"

export default function Home() {
    const { auth } = usePage<PageProps>().props
    const [EyesOpen, setEyesOpen] = useState(false)

    return (
        <div className="flex h-screen items-center justify-center">
            <div className="w-full max-w-xl h-screen bg-white rounded-2xl shadow-lg p-6">

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar>
                            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>

                        <div className="flex flex-col">
                            <h1 className="font-semibold text-2xl">
                                Hi, {auth.user.name}
                            </h1>
                            <p className="text-sm text-gray-500">Welcome Back!</p>
                        </div>
                    </div>

                    <button onClick={() => router.visit(route('profile.edit'))}>
                        <SettingsIcon className="h-6 w-6 text-gray-600" />
                    </button>
                </div>


                <div className="mt-10">
                    <p className="text-xl text-gray-500">Wallet balance</p>

                    <div className='flex items-center gap-10'>
                    <p className="text-4xl font-semibold">Rp. 100.000,00</p>
                    <button onClick={() => setEyesOpen(!EyesOpen)}>
                        {EyesOpen ? <EyeIcon className="h-6 w-6 text-gray-600" onClick={() => setEyesOpen(false)} /> 
                        : 
                        <EyeClosedIcon className="h-6 w-6 text-gray-600" onClick={() => setEyesOpen(true)} />}
                    </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

