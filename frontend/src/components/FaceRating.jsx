import React from 'react';
import '../styles/FaceRating.css';

/**
 * FaceRating component
 *
 * Displays the AI facial analysis result.
 * Currently shows stub data returned by the placeholder service.
 */
export default function FaceRating({ rating }) {
  if (!rating) return null;

  const { score, breakdown, note } = rating;

  return (
    <div className="face-rating">
      <h3 className="rating-title">
        Face Score: <span className="score">{score.toFixed(1)}</span> / 10
      </h3>
      {breakdown && (
        <ul className="breakdown">
          {Object.entries(breakdown).map(([key, val]) => (
            <li key={key}>
              <span className="breakdown-label">{key}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(val / 10) * 100}%` }}
                />
              </div>
              <span className="breakdown-val">{val.toFixed(1)}</span>
            </li>
          ))}
        </ul>
      )}
      {note && <p className="rating-note">{note}</p>}
    </div>
  );
}
