import ProfileSetup from './pages/ProfileSetup'

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/profile-setup" element={<ProfileSetup />} />
                    <Route element={<Layout />}>
                        <Route path="/" element={<Home />} />
                        import Entry from './pages/Entry'
                        import Exit from './pages/Exit'
                        import Admin from './pages/Admin'

                        export default function App() {
    return (
                        <AuthProvider>
                            <BrowserRouter>
                                <Routes>
                                    <Route path=\"/login\" element={<Login />} />
                                    <Route element={<Layout />}>
                                        <Route path=\"/\" element={<Home />} />
                                        <Route path=\"/entry\" element={<Entry />} />
                                        <Route path=\"/exit\" element={<Exit />} />
                                        <Route path=\"/admin\" element={<Admin />} />
                                    </Route>
                                    <Route path=\"*\" element={<Navigate to=\"/\" replace />} />
                                </Routes>
                            </BrowserRouter>
                        </AuthProvider>
                        )
}
