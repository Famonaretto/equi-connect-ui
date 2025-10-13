'use client';

import { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DOMPurify from 'dompurify'; // ⬅️ dodane

interface BlogPost {
  id: string;
  title: string;
  content: string;
  image: string;
  date?: any;
}

export default function BlogDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchPost = async () => {
      const db = getFirestore(app);
      const docRef = doc(db, 'blog', id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPost({ id: docSnap.id, ...docSnap.data() } as BlogPost);
      }
    };
    fetchPost();
  }, [id]);

  if (!post) {
    return <p style={{ padding: '2rem' }}>Ładowanie artykułu...</p>;
  }

  // ⬅️ Oczyszczamy HTML przed wyświetleniem
  const safeContent = DOMPurify.sanitize(post.content);

  return (
    <article style={{ maxWidth: '900px', margin: '4rem auto', padding: '2rem' }}>
      <Link href="/blog" style={{ display: 'inline-block', marginBottom: '1rem', color: '#0D1F40' }}>
        ← Powrót do bloga
      </Link>
      <h1 style={{ fontSize: '2rem', color: '#0D1F40', marginBottom: '1rem' }}>{post.title}</h1>
      {post.date?.toDate && (
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
          {post.date.toDate().toLocaleDateString()}
        </p>
      )}
      <img
        src={post.image}
        alt={post.title}
        style={{
          width: '100%',
          height: '400px',
          objectFit: 'cover',
          borderRadius: '0.5rem',
          marginBottom: '2rem',
        }}
      />
      <div
        style={{ lineHeight: '1.7', fontSize: '1.05rem' }}
        dangerouslySetInnerHTML={{ __html: safeContent }} // ⬅️ używamy oczyszczonego HTML
      ></div>
    </article>
  );
}
