import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              Ohako Fitness
            </Link>
          </div>
          
          <nav className="flex space-x-8">
            <Link 
              href="/line-connect" 
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              LINE連携
            </Link>
            <Link 
              href="/admin-page-customer/conversions" 
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              コンバージョン管理
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
