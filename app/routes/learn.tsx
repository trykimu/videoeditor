import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from 'remotion';
import { Player } from '@remotion/player';
import { createTikTokStyleCaptions } from '@remotion/captions';

type Caption = {
  text: string;
  startMs: number;
  endMs: number;
  timestampMs: number | null;
  confidence: number | null;
  left: string;
  top?: string;
};


const captions: Caption[] = [
  {
    text: 'Hi,',
    startMs: 0,
    endMs: 500,
    timestampMs: 250,
    confidence: 0.95,
    left: '10%',
  },
  {
    text: ' Welcome efd sdf sd fsd fsd fsd f sf sdf sd fsd fsd fs d',
    startMs: 500,
    endMs: 800,
    timestampMs: 650,
    confidence: 0.98,
    left: '20%',
  },
  {
    text: ' to',
    startMs: 800,
    endMs: 1100,
    timestampMs: 950,
    confidence: 0.99,
    left: '30%',
  },
  {
    text: ' Kimu',
    startMs: 1100,
    endMs: 1800,
    timestampMs: 1450,
    confidence: 0.97,
    left: '40%',
  },
  {
    text: ' world',
    startMs: 1800,
    endMs: 2200,
    timestampMs: 2000,
    confidence: 0.96,
    left: '50%',
  },
  {
    text: ' of',
    startMs: 2200,
    endMs: 2500,
    timestampMs: 2350,
    confidence: 0.99,
    left: '60%',
  },
  {
    text: ' Remotion',
    startMs: 2500,
    endMs: 3200,
    timestampMs: 2850,
    confidence: 0.98,
    left: '70%',
  },
  {
    text: ' video',
    startMs: 3200,
    endMs: 3800,
    timestampMs: 3500,
    confidence: 0.97,
    left: '80%',
  },
  {
    text: ' editing!',
    startMs: 3800,
    endMs: 4500,
    timestampMs: 4150,
    confidence: 0.95,
    left: '90%',
  },
];

// Create TikTok-style caption pages
const { pages } = createTikTokStyleCaptions({
  captions,
  combineTokensWithinMilliseconds: 1200, // Group words within 1.2 seconds
});

interface CaptionPageProps {
  page: {
    text: string;
    startMs: number;
    durationMs: number;
    tokens: Array<{
      text: string;
      fromMs: number;
      toMs: number;
    }>;
  };
}

const CaptionPage = ({ page }: CaptionPageProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation for the page entrance
  const pageProgress = spring({
    frame,
    fps,
    config: {
      damping: 15,
      stiffness: 200,
    },
  });

  const opacity = interpolate(pageProgress, [0, 0.2, 1], [0, 1, 1]);

  const findPositionForToken = (token: { text: string; fromMs: number; toMs: number }) => {
    const byTime = captions.find(
      (c) => Math.abs(c.startMs - token.fromMs) <= 50 && Math.abs(c.endMs - token.toMs) <= 50
    );
    if (byTime) {
      return { left: byTime.left, top: byTime.top ?? '80%' };
    }
    const byText = captions.find((c) => c.text.trim() === token.text.trim());
    return { left: byText?.left ?? '50%', top: byText?.top ?? '80%' };
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        fontFamily: 'Arial, sans-serif',
        zIndex: 10, // Ensure CaptionPage is above other elements
      }}
    >
      {/* Render each token with individual animation */}
      {page.tokens.map((token, index) => {
        // Inside a <Sequence />, `frame` starts at 0 at `page.startMs`.
        // Make token timing relative to the page start to avoid double-offsets.
        const tokenRelativeStartFrame = ((token.fromMs - page.startMs) / 1000) * fps;
        const tokenProgress = spring({
          frame: frame - tokenRelativeStartFrame,
          fps,
          config: {
            damping: 12,
            stiffness: 150,
          },
        });

        const tokenOpacity = interpolate(tokenProgress, [0, 0.3], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        const tokenScale = interpolate(tokenProgress, [0, 0.3], [0.9, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        const { left, top } = findPositionForToken(token);

        return (
          <span
            key={`token-${page.startMs}-${token.fromMs}-${token.toMs}`}
            style={{
              position: 'absolute',
              left,
              top,
              opacity: tokenOpacity,
              transform: `translate(-50%, -50%) scale(${tokenScale})`,
              display: 'inline-block',
              transition: 'transform 0.1s ease-out',
              fontSize: '3rem',
              fontWeight: 'bold',
              color: '#ffffff',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
            }}
            onMouseEnter={() => {
              console.log('mouse entered token', token.text);
            }}
            onMouseLeave={() => {
              console.log('mouse left token', token.text);
            }}
          >
            {token.text}
          </span>
        );
      })}
    </div>
  );
};

const TikTokStyleCaptionsExample: React.FC = () => {
  const { fps } = useVideoConfig();

  console.log('pages', JSON.stringify(pages, null, 2));

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Background content */}
      <div
        style={{
          fontSize: '6rem',
          color: 'rgba(255, 255, 255, 0.1)',
          fontWeight: 'bold',
          textAlign: 'center',
        }}
      >
        Kimu
      </div>

      {/* Render each caption page as a sequence */}
      {pages.map((page, index) => (
        <Sequence
          key={`page-${page.startMs}`}
          from={(page.startMs / 1000) * fps}
          durationInFrames={(page.durationMs / 1000) * fps}
        >
          <CaptionPage page={page} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// Additional example showing different caption styles
const AlternativeCaptionStyle: React.FC<CaptionPageProps> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        position: 'absolute',
        top: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#ffff00',
        textAlign: 'center',
        WebkitTextStroke: '1px black',
        // Allow wrapping within a constrained width
        maxWidth: '90%',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        fontFamily: 'Impact, Arial Black, sans-serif',
        letterSpacing: '2px',
        zIndex: 5, // Lower z-index than CaptionPage
      }}
    >
      {page.tokens.map((token, index) => {
        const tokenRelativeStartFrame = ((token.fromMs - page.startMs) / 1000) * fps;
        const isActive = frame >= tokenRelativeStartFrame;

        return (
          <span
            key={`alt-token-${token.fromMs}`}
            style={{
              opacity: isActive ? 1 : 0.3,
              color: isActive ? '#ffff00' : '#ffffff',
              textShadow: isActive
                ? '0 0 10px #ffff00, 2px 2px 4px rgba(0, 0, 0, 0.8)'
                : '2px 2px 4px rgba(0, 0, 0, 0.8)',
              transition: 'all 0.2s ease-out',
            }}
          >
            {token.text}
          </span>
        );
      })}
    </div>
  );
};

// Composition showcasing different caption configurations
export const CaptionsShowcase: React.FC = () => {
  const { fps } = useVideoConfig();

  // Create pages with different timing for comparison
  const quickPages = createTikTokStyleCaptions({
    captions,
    combineTokensWithinMilliseconds: 600, // Faster word switching
  }).pages;

  const slowPages = createTikTokStyleCaptions({
    captions,
    combineTokensWithinMilliseconds: 2000, // Slower, more words per page
  }).pages;

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(45deg, #1e3c72 0%, #2a5298 100%)',
      }}
    >
      {/* Main TikTok-style captions */}
      {pages.map((page, index) => (
        <Sequence
          key={`main-${page.startMs}`}
          from={(page.startMs / 1000) * fps}
          durationInFrames={(page.durationMs / 1000) * fps}
        >
          <CaptionPage page={page} />
        </Sequence>
      ))}

      {/* Alternative style captions */}
      {quickPages.map((page, index) => (
        <Sequence
          key={`alt-${page.startMs}`}
          from={(page.startMs / 1000) * fps}
          durationInFrames={(page.durationMs / 1000) * fps}
        >
          <AlternativeCaptionStyle page={page} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// Player component to view the captions
const CaptionsPlayer = () => {
  const videoConfig = {
    id: 'TikTokCaptions',
    width: 1080,
    height: 1920, // Vertical video format like TikTok
    fps: 30,
    durationInFrames: 150, // 5 seconds at 30fps
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#333' }}>
        TikTok-Style Captions Demo
      </h1>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        {/* Main Player */}
        <div style={{
          border: '2px solid #333',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <Player
            component={TikTokStyleCaptionsExample}
            durationInFrames={videoConfig.durationInFrames}
            compositionWidth={videoConfig.width}
            compositionHeight={videoConfig.height}
            fps={videoConfig.fps}
            style={{
              width: '300px',
              height: '533px', // Maintain aspect ratio
            }}
            controls
            loop
          />
        </div>

        {/* Alternative showcase player */}
        <div style={{
          border: '2px solid #333',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <Player
            component={CaptionsShowcase}
            durationInFrames={videoConfig.durationInFrames}
            compositionWidth={videoConfig.width}
            compositionHeight={videoConfig.height}
            fps={videoConfig.fps}
            style={{
              width: '300px',
              height: '533px', // Maintain aspect ratio
            }}
            controls
            loop
          />
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          maxWidth: '600px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>Features Demonstrated:</h3>
          <ul style={{ color: '#666', lineHeight: '1.6' }}>
            <li>🎬 TikTok-style animated captions with spring animations</li>
            <li>⏱️ Word-by-word timing synchronization</li>
            <li>🎨 Multiple caption styles (bottom and top positioning)</li>
            <li>📱 Vertical video format (1080x1920)</li>
            <li>🔄 Different pacing configurations</li>
            <li>✨ Smooth transitions and scaling effects</li>
          </ul>

          <p style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            fontSize: '0.9rem',
            color: '#666'
          }}>
            💡 Use the video controls to play, pause, and scrub through the timeline to see how captions sync with timing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CaptionsPlayer;
