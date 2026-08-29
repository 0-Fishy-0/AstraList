import express from 'express';
import cors from 'cors';

const app = express();

const PORT = 3000;

app.use(cors({
    origin: 'http://localhost:5173'
}))

app.get('/hello', (req, res) => {
    res.json({text: "Hello from Astralist Backend"});
});
app.get('/auth/anilist', (req, res) => {
    res.redirect('http://localhost:5173')
})
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});