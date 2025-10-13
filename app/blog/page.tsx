'use client';

import { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  date?: any; // Firestore Timestamp
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const db = getFirestore(app);
      const snapshot = await getDocs(collection(db, 'blog'));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as BlogPost[];
      setPosts(data);
    };
    fetchPosts();
  }, []);

  return (
    <section style={{ maxWidth: '900px', margin: '4rem auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0D1F40', marginBottom: '1rem' }}>
        Blog – wiedza dla właścicieli i specjalistów
      </h1>
      <p style={{ marginBottom: '2rem' }}>
        Sprawdź artykuły tworzone przez ekspertów – pomagamy lepiej zrozumieć konie.
      </p>

      {posts.map(post => (
        <div
          key={post.id}
          style={{
            display: 'flex',
            gap: '1.5rem',
            marginBottom: '2rem',
            padding: '1rem',
            border: '1px solid #ccc',
            borderRadius: '1rem',
            alignItems: 'center',
          }}
        >
          <img
            src={post.image}
            alt={post.title}
            style={{
              width: '180px',
              height: '120px',
              objectFit: 'cover',
              borderRadius: '0.5rem',
            }}
          />
          <div>
            <Link href={`/blog/${post.id}`} style={{ textDecoration: 'none' }}>
              <h2 style={{ fontSize: '1.3rem', color: '#0D1F40', margin: '0 0 0.4rem' }}>
                {post.title}
              </h2>
            </Link>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.4rem' }}>
              {post.date?.toDate
                ? post.date.toDate().toLocaleDateString()
                : ''}
            </p>
            <p>{post.excerpt}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
