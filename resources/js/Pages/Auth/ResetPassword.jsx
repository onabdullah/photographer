import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

const inputClass =
    'mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-400 dark:focus:ring-primary-400';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token,
        email: email || '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Reset Password" />

            <h1 className="text-xl font-semibold text-gray-900 dark:text-white text-center">
                Reset password
            </h1>

            {(errors.email || errors.password || errors.password_confirmation) && (
                <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                    {errors.email || errors.password || errors.password_confirmation}
                </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                    <InputLabel htmlFor="email" value="Email" className="text-gray-700 dark:text-gray-300" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className={inputClass}
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    <InputError message={errors.email} className="mt-1" />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Password" className="text-gray-700 dark:text-gray-300" />
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className={inputClass}
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError message={errors.password} className="mt-1" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm password"
                        className="text-gray-700 dark:text-gray-300"
                    />
                    <TextInput
                        type="password"
                        id="password_confirmation"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className={inputClass}
                        autoComplete="new-password"
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                    />
                    <InputError message={errors.password_confirmation} className="mt-1" />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:focus:ring-offset-gray-800"
                    >
                        {processing ? 'Resetting…' : 'Reset password'}
                    </button>
                </div>

                <p className="text-center pt-2">
                    <Link
                        href={route('login')}
                        className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 focus:outline-none focus:underline focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                    >
                        Back to log in
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
