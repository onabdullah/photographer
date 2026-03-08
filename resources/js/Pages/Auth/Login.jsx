import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            <h1 className="text-xl font-semibold text-gray-900 dark:text-white text-center">
                Log in
            </h1>

            {status && (
                <div className="mt-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 px-4 py-3 text-sm text-green-800 dark:text-green-300">
                    {status}
                </div>
            )}

            {(errors.email || errors.password) && (
                <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                    {errors.email || errors.password}
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
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-400 dark:focus:ring-primary-400"
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
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-400 dark:focus:ring-primary-400"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError message={errors.password} className="mt-1" />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-400"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Remember me
                        </span>
                    </label>
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 focus:outline-none focus:underline focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                        >
                            Forgot your password?
                        </Link>
                    )}
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:focus:ring-offset-gray-800"
                    >
                        {processing ? 'Signing in…' : 'Log in'}
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
