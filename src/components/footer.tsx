export default function Footer() {
  return (
    <footer className="border-t py-6">
      <div className="container text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} GigaStudio</p>
      </div>
    </footer>
  );
}