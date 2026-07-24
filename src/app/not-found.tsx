import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="relative">
                {/* Glow effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px]" />

                <h1 className="relative text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/10 z-10">
                    404
                </h1>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4">Page Not Found</h2>
            <p className="text-gray-400 text-center max-w-md mb-8">
                Looks like you've wandered into the void. This page doesn't exist.
            </p>

            <Link
                href="/"
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 transition-colors rounded-xl font-semibold shadow-lg shadow-blue-500/20"
            >
                Return Home
            </Link>
        </div>
    );
}
