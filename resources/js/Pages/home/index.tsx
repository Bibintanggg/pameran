import Cards from "@/Components/AddCards"
import CardBalance from "@/Components/CardBalance"
import CardIndex from "@/Components/CardIndex"
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
                        <p className="text-5xl font-semibold">{EyesOpen ? "Rp.100.000,00" : "••••••••"}</p>
                        <button onClick={() => setEyesOpen(!EyesOpen)}>
                            {EyesOpen ? <EyeIcon className="h-6 w-6 text-gray-600" onClick={() => setEyesOpen(false)} />
                                :
                                <EyeClosedIcon className="h-6 w-6 text-gray-600" onClick={() => setEyesOpen(true)} />}
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <Cards label={'Cards'} />
                        <CardIndex currency="IDR" balance={15000} eyesOpen={EyesOpen} />
                    </div>

                    <div className='mt-8'>
                        <div className="relative bg-[#9290FE] w-[33rem] h-52 rounded-2xl p-4 flex flex-col justify-between overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-[#7A78D1] rounded-full opacity-50 -translate-x-1/3 -translate-y-1/3"></div>
                            <div className="absolute bottom-6 left-0 space-y-2">
                                <div className="w-16 h-2 bg-[#7A78D1] rounded-full"></div>
                                <div className="w-22 h-2 bg-[#7A78D1] rounded-full "></div>
                                <div className="w-20 h-2 bg-[#7A78D1] rounded-full"></div>
                            </div>

                            <div>
                                <CardBalance currency="RP" type="Income" icon={<EyeClosedIcon/>} rate={58} balance={10000}/>
                            </div>



                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}

