import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useRef, ChangeEvent } from 'react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const user = usePage().props.auth.user;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, errors, processing, recentlySuccessful, reset } =
        useForm({
            name: user.name,
            email: user.email,
            avatar: null as File | null,
            _method: 'PATCH', // Tambahkan ini untuk method spoofing
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Gunakan post dengan FormData untuk handle file upload
        post(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => reset('avatar'),
            forceFormData: true, // Penting untuk file upload
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

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Profile Information
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Update your account's profile information and email address.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                {/* Avatar Upload Section */}
                <div>
                    <InputLabel htmlFor="avatar" value="Profile Avatar" />
                    
                    <div className="flex items-center mt-2 space-x-4">
                        <div className="relative">
                            <img
                                src={getAvatarUrl()}
                                alt="Avatar"
                                className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                            />
                            {data.avatar && (
                                <button
                                    type="button"
                                    onClick={removeAvatar}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarChange}
                                accept="image/jpeg,image/png,image/jpg"
                                className="hidden"
                                id="avatar"
                            />
                            <button
                                type="button"
                                onClick={triggerFileInput}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                            >
                                {user.avatar ? 'Change Avatar' : 'Upload Avatar'}
                            </button>
                            <p className="text-xs text-gray-500">
                                Max 2MB. JPG, JPEG, PNG only.
                            </p>
                        </div>
                    </div>

                    <InputError className="mt-2" message={errors.avatar} />
                    
                    {data.avatar && (
                        <p className="mt-2 text-sm text-green-600">
                            New avatar selected: {data.avatar.name}
                        </p>
                    )}
                </div>

                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800">
                            Your email address is unverified.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ml-1"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}