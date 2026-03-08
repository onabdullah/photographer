import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function TwoFactorChallenge() {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login.two-factor.verify'));
    };

    return (
        <GuestLayout>
            <Head title="Two-factor authentication" />

            <h1 className="text-xl font-semibold text-gray-900 dark:text-white text-center">
                Two-factor authentication
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
                Enter the 6-digit code from your authenticator app.
            </p>

            {errors.code && (
                <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                    {errors.code}
                </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                    <InputLabel htmlFor="code" value="Authentication code" className="text-gray-700 dark:text-gray-300" />
                    <input
                        id="code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={data.code}
                        onChange={(e) => setData('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:focus:border-primary-400 text-center text-lg tracking-[0.5em] font-mono"
                        placeholder="000000"
                    />
                    <InputError message={errors.code} className="mt-1" />
                </div>
                <button
                    type="submit"
                    disabled={processing || data.code.length !== 6}
                    className="w-full flex justify-center py-2.5 px-4 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                    {processing ? 'Verifying…' : 'Verify'}
                </button>
            </form>

            <p className="mt-4 text-center">
                <a href={route('login')} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                    Back to log in
                </a>
            </p>
        </GuestLayout>
    );
}
