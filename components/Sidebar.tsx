export default function Sidebar() {
  return (
    <aside className="hidden min-h-[calc(100vh-4rem)] w-64 border-r bg-white p-5 md:block">
      <nav className="space-y-2">
        <a
          href="/"
          className="block rounded-lg bg-blue-50 px-4 py-3 font-medium text-blue-600"
        >
          Dashboard
        </a>

        <a
          href="/tasks"
          className="block rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-50"
        >
          My Tasks
        </a>

        <a
          href="/categories"
          className="block rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-50"
        >
          Categories
        </a>

        <a
          href="/settings"
          className="block rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-50"
        >
          Settings
        </a>
      </nav>
    </aside>
  );
}