// Temporary test component to isolate blank screen issue
function TestApp() {
  return (
    <div className="min-h-screen bg-red-500 flex items-center justify-center">
      <h1 className="text-white text-4xl">Test App - If you see this, React is working!</h1>
    </div>
  );
}

export default TestApp;