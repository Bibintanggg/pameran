import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import BottomNavbar from '@/Components/BottomNavbar';
import Sidebar from '@/Components/Sidebar';
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { Transition } from '@headlessui/react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useRef, ChangeEvent, useState } from 'react';
import {
    Camera,
    User,
    Mail,
    Upload,
    X,
    ArrowLeft,
    Settings,
    Shield,
    Bell,
    Lock,
    Trash2
} from 'lucide-react';
import { useActiveCard } from "@/context/ActiveCardContext";
import UpdatePasswordForm from './UpdatePasswordForm';
import DeleteUserForm from './DeleteUserForm';
import { useToast } from "@/hooks/use-toast"

type ProfileForm = {
    name: string;
    email: string;
    avatar: File | null;
    _method: string;
}

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const { props } = usePage();
    const { auth, cards = [], incomePerCard = {}, expensePerCard = {} } = props as any;
    const user = auth?.user;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [EyesOpen, setEyesOpen] = useState(false);
    const [activeSecurityTab, setActiveSecurityTab] = useState('password'); // 'password' or 'delete'

    // Use context for active card
    const { activeCardId, setActiveCardId } = useActiveCard();
    const activeCard = cards?.find((card: any) => card.id === activeCardId);

    const { toast } = useToast()

    // Return early if user is not available
    if (!user) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9290FE] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
            </div>
        </div>;
    }

    const { data, setData, post, errors, processing, recentlySuccessful, reset } =
        useForm<ProfileForm>({
            name: user.name,
            email: user.email,
            avatar: null as File | null,
            _method: 'PATCH',
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                reset('avatar');
                router.reload({ only: ['auth'] });
                toast({
                    title: "Success!",
                    description: "Your profile has been saved successfully."
                })
            },
            forceFormData: true,
        });
    };

    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('avatar', file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const removeAvatar = () => {
        setData('avatar', null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getAvatarUrl = () => {
        if (data.avatar) {
            return URL.createObjectURL(data.avatar);
        }
        return user.avatar ? `/storage/${user.avatar}` : '/default-avatar.png';
    };

    const getUserInitials = () => {
        const names = user.name.split(' ');
        if (names.length >= 2) {
            return names[0][0] + names[names.length - 1][0];
        }
        return names[0][0];
    };

    const SecurityTabButton = ({ id, label, icon, isActive, onClick }: any) => (
        <button
            onClick={onClick}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${isActive
                ? 'bg-[#9290FE] text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Layout */}
            <div className="lg:hidden flex min-h-screen items-center justify-center bg-gray-100">
                <div className="relative w-full max-w-md h-screen bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
                    <BottomNavbar />

                    {/* Mobile Header */}
                    <div className="bg-gradient-to-r from-[#9290FE] to-[#7A78D1] p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => router.visit(route('home.index'))}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-xl font-bold">Profile Settings</h1>
                            <div className="w-9 h-9"></div>
                        </div>

                        {/* Avatar Section */}
                        <div className="flex flex-col items-center">
                            <div className="relative mb-4">
                                <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                                    <AvatarImage
                                        src={getAvatarUrl()}
                                        alt={user.name}
                                    />
                                    <AvatarFallback className="bg-blue-500 text-white font-semibold text-lg">
                                        {getUserInitials()}
                                    </AvatarFallback>
                                </Avatar>

                                <button
                                    type="button"
                                    onClick={triggerFileInput}
                                    className="absolute -bottom-1 -right-1 bg-white text-[#9290FE] rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>

                                {data.avatar && (
                                    <button
                                        type="button"
                                        onClick={removeAvatar}
                                        className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            <h2 className="text-xl font-bold">{user.name}</h2>
                            <p className="text-white/80 text-sm">{user.email}</p>
                        </div>
                    </div>

                    {/* Mobile Form */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <form onSubmit={submit} className="space-y-6">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarChange}
                                accept="image/jpeg,image/png,image/jpg"
                                className="hidden"
                            />

                            {data.avatar && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <p className="text-sm text-green-700 flex items-center">
                                        <Upload className="w-4 h-4 mr-2" />
                                        New avatar selected: {data.avatar.name}
                                    </p>
                                </div>
                            )}

                            <InputError className="text-center" message={errors.avatar} />

                            {/* Name Field */}
                            <div className="space-y-2">
                                <InputLabel htmlFor="name" className="flex items-center text-gray-700">
                                    <User className="w-4 h-4 mr-2" />
                                    Full Name
                                </InputLabel>
                                <TextInput
                                    id="name"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9290FE] focus:border-transparent"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    autoComplete="name"
                                />
                                <InputError message={errors.name} />
                            </div>

                            {/* Email Field */}
                            <div className="space-y-2">
                                <InputLabel htmlFor="email" className="flex items-center text-gray-700">
                                    <Mail className="w-4 h-4 mr-2" />
                                    Email Address
                                </InputLabel>
                                <TextInput
                                    id="email"
                                    type="email"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9290FE] focus:border-transparent"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/* Email Verification Notice */}
                            {mustVerifyEmail && user.email_verified_at === null && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="flex items-center mb-2">
                                        <Shield className="w-5 h-5 text-yellow-600 mr-2" />
                                        <p className="text-sm font-medium text-yellow-800">Email Verification Required</p>
                                    </div>
                                    <p className="text-sm text-yellow-700 mb-3">
                                        Your email address is unverified.
                                    </p>
                                    <Link
                                        href={route('verification.send')}
                                        method="post"
                                        as="button"
                                        className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
                                    >
                                        Resend Verification Email
                                    </Link>
                                </div>
                            )}

                            {status === 'verification-link-sent' && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-sm text-green-700 flex items-center">
                                        <Bell className="w-4 h-4 mr-2" />
                                        A new verification link has been sent to your email address.
                                    </p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="pt-4">
                                <PrimaryButton
                                    disabled={processing}
                                    className="w-full bg-gradient-to-r from-[#9290FE] to-[#7A78D1] py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                                >
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </PrimaryButton>

                                <Transition
                                    show={recentlySuccessful}
                                    enter="transition ease-in-out duration-300"
                                    enterFrom="opacity-0 transform translate-y-2"
                                    leave="transition ease-in-out duration-300"
                                    leaveTo="opacity-0 transform translate-y-2"
                                >
                                    <p className="text-green-600 text-center mt-3 font-medium">
                                        Profile updated successfully!
                                    </p>
                                </Transition>
                            </div>
                        </form>

                        {/* Mobile Security Section */}
                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>

                            {/* Mobile Security Tabs */}
                            <div className="flex space-x-2 mb-6">
                                <SecurityTabButton
                                    id="password"
                                    label="Change Password"
                                    icon={<Lock className="w-4 h-4" />}
                                    isActive={activeSecurityTab === 'password'}
                                    onClick={() => setActiveSecurityTab('password')}
                                />
                                <SecurityTabButton
                                    id="delete"
                                    label="Delete Account"
                                    icon={<Trash2 className="w-4 h-4" />}
                                    isActive={activeSecurityTab === 'delete'}
                                    onClick={() => setActiveSecurityTab('delete')}
                                />
                            </div>

                            {/* Mobile Security Content */}
                            {activeSecurityTab === 'password' && <UpdatePasswordForm className="space-y-4" />}
                            {activeSecurityTab === 'delete' && <DeleteUserForm className="space-y-4" />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:flex min-h-screen">
                <Sidebar
                    auth={auth}
                    activeCard={activeCard}
                    activeCardId={activeCardId ?? 0}
                    EyesOpen={EyesOpen}
                    setEyesOpen={setEyesOpen}
                    incomePerCard={incomePerCard}
                    expensePerCard={expensePerCard}
                />

                <div className="flex-1 overflow-hidden bg-gray-50">
                    <div className="h-full overflow-y-auto">
                        {/* Desktop Header */}
                        <div className="bg-white shadow-sm border-b border-gray-100 p-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={() => router.visit(route('home.index'))}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                                    </button>
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                                        <p className="text-gray-500 mt-1">Manage your account information and preferences</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Settings className="w-6 h-6 text-gray-400" />
                                </div>
                            </div>
                        </div>

                        {/* Desktop Content */}
                        <div className="p-8">
                            <div className="max-w-4xl mx-auto">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Profile Card */}
                                    <div className="lg:col-span-1">
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-8">
                                            <div className="text-center">
                                                <div className="relative inline-block mb-6">
                                                    <Avatar className="h-32 w-32 border-4 border-gray-100 shadow-lg">
                                                        <AvatarImage
                                                            src={getAvatarUrl()}
                                                            alt={user.name}
                                                        />
                                                        <AvatarFallback className="bg-gradient-to-br from-[#9290FE] to-[#7A78D1] text-white font-bold text-2xl">
                                                            {getUserInitials()}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <button
                                                        type="button"
                                                        onClick={triggerFileInput}
                                                        className="absolute -bottom-2 -right-2 bg-[#9290FE] text-white rounded-full p-3 shadow-lg hover:bg-[#7A78D1] transition-colors"
                                                    >
                                                        <Camera className="w-5 h-5" />
                                                    </button>

                                                    {data.avatar && (
                                                        <button
                                                            type="button"
                                                            onClick={removeAvatar}
                                                            className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600 transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>

                                                <h2 className="text-xl font-bold text-gray-900 mb-2">{user.name}</h2>
                                                <p className="text-gray-500 mb-4">{user.email}</p>

                                                {data.avatar && (
                                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                                        <p className="text-sm text-green-700 flex items-center justify-center">
                                                            <Upload className="w-4 h-4 mr-2" />
                                                            Ready to upload: {data.avatar.name}
                                                        </p>
                                                    </div>
                                                )}

                                                <InputError className="text-center mb-4" message={errors.avatar} />

                                                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                                                    <p>• Maximum file size: 2MB</p>
                                                    <p>• Supported formats: JPG, JPEG, PNG</p>
                                                    <p>• Recommended: Square image (1:1 ratio)</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Form Card */}
                                    <div className="lg:col-span-2 space-y-8">
                                        {/* Profile Information Card */}
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                                            <div className="mb-6">
                                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Information</h2>
                                                <p className="text-gray-600">Update your account's profile information and email address.</p>
                                            </div>

                                            <form onSubmit={submit} className="space-y-6">
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleAvatarChange}
                                                    accept="image/jpeg,image/png,image/jpg"
                                                    className="hidden"
                                                />

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Name Field */}
                                                    <div className="space-y-3">
                                                        <InputLabel htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center">
                                                            <User className="w-4 h-4 mr-2" />
                                                            Full Name
                                                        </InputLabel>
                                                        <TextInput
                                                            id="name"
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9290FE] focus:border-transparent transition-all"
                                                            value={data.name}
                                                            onChange={(e) => setData('name', e.target.value)}
                                                            required
                                                            autoComplete="name"
                                                        />
                                                        <InputError message={errors.name} />
                                                    </div>

                                                    {/* Email Field */}
                                                    <div className="space-y-3">
                                                        <InputLabel htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center">
                                                            <Mail className="w-4 h-4 mr-2" />
                                                            Email Address
                                                        </InputLabel>
                                                        <TextInput
                                                            id="email"
                                                            type="email"
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9290FE] focus:border-transparent transition-all"
                                                            value={data.email}
                                                            onChange={(e) => setData('email', e.target.value)}
                                                            required
                                                            autoComplete="email"
                                                        />
                                                        <InputError message={errors.email} />
                                                    </div>
                                                </div>

                                                {/* Email Verification Notice */}
                                                {mustVerifyEmail && user.email_verified_at === null && (
                                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                                                        <div className="flex items-start space-x-3">
                                                            <Shield className="w-6 h-6 text-yellow-600 mt-0.5" />
                                                            <div className="flex-1">
                                                                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Email Verification Required</h3>
                                                                <p className="text-yellow-700 mb-4">
                                                                    Your email address is unverified. Please check your inbox and click the verification link.
                                                                </p>
                                                                <Link
                                                                    href={route('verification.send')}
                                                                    method="post"
                                                                    as="button"
                                                                    className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                                                                >
                                                                    Resend Verification Email
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {status === 'verification-link-sent' && (
                                                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                                                        <div className="flex items-center space-x-3">
                                                            <Bell className="w-6 h-6 text-green-600" />
                                                            <div>
                                                                <h3 className="font-semibold text-green-800">Verification Email Sent</h3>
                                                                <p className="text-green-700">A new verification link has been sent to your email address.</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Submit Button */}
                                                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                                                    <div className="flex items-center space-x-4">
                                                        <PrimaryButton
                                                            disabled={processing}
                                                            className="bg-gradient-to-r from-[#9290FE] to-[#7A78D1] px-8 py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                                                        >
                                                            {processing ? (
                                                                <span className="flex items-center">
                                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                    Saving...
                                                                </span>
                                                            ) : (
                                                                'Save Changes'
                                                            )}
                                                        </PrimaryButton>

                                                        <Transition
                                                            show={recentlySuccessful}
                                                            enter="transition ease-in-out duration-300"
                                                            enterFrom="opacity-0 transform translate-x-4"
                                                            leave="transition ease-in-out duration-300"
                                                            leaveTo="opacity-0 transform translate-x-4"
                                                        >
                                                            <div className="flex items-center text-green-600 font-medium">
                                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                                </svg>
                                                                Profile updated successfully!
                                                            </div>
                                                        </Transition>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>

                                        {/* Security Settings Card */}
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                                            <div className="mb-6">
                                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Settings</h2>
                                                <p className="text-gray-600">Manage your password and account security options.</p>
                                            </div>

                                            {/* Desktop Security Tabs */}
                                            <div className="flex space-x-4 mb-8 border-b border-gray-200">
                                                <button
                                                    onClick={() => setActiveSecurityTab('password')}
                                                    className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeSecurityTab === 'password'
                                                        ? 'border-[#9290FE] text-[#9290FE]'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <Lock className="w-4 h-4" />
                                                        <span>Change Password</span>
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => setActiveSecurityTab('delete')}
                                                    className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeSecurityTab === 'delete'
                                                        ? 'border-red-500 text-red-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <Trash2 className="w-4 h-4" />
                                                        <span>Delete Account</span>
                                                    </div>
                                                </button>
                                            </div>

                                            {/* Desktop Security Content */}
                                            <div>
                                                {activeSecurityTab === 'password' && <UpdatePasswordForm />}
                                                {activeSecurityTab === 'delete' && <DeleteUserForm />}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
