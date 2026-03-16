#!/bin/bash
# OpenBay Reddit Recon Script
# Searches Reddit for posts about golf bay booking frustrations
# Results saved to data/reddit-recon/YYYY-MM-DD.json

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$PROJECT_DIR/data/reddit-recon"
OUTPUT_FILE="$DATA_DIR/$(date +%Y-%m-%d).json"

# Subreddits to search
SUBREDDITS=("golf" "GolfSimulator" "pga")

# Search terms
SEARCH_TERMS=("practice bay" "can't book" "booking system" "sold out" "bay reservation" "PGA superstore booking" "uschedule")

# Ensure data directory exists
mkdir -p "$DATA_DIR"

# Initialize results array
RESULTS=()

echo "🔍 OpenBay Reddit Recon - $(date)"
echo "================================"

# Function to search Reddit
search_reddit() {
    local subreddit=$1
    local query=$2
    local encoded_query=$(echo "$query" | sed 's/ /%20/g')
    
    local url="https://www.reddit.com/r/$subreddit/search.json?q=$encoded_query&restrict_sr=1&sort=relevance&t=year&limit=25"
    
    # Fetch results with proper user agent (Reddit requires this)
    local response=$(curl -s -A "OpenBay-Recon/1.0" "$url")
    
    # Parse with jq if available
    if command -v jq &> /dev/null; then
        echo "$response" | jq -r '.data.children[]? | 
            {
                title: .data.title,
                subreddit: .data.subreddit,
                score: .data.score,
                num_comments: .data.num_comments,
                url: "https://reddit.com" + .data.permalink,
                created: .data.created_utc,
                created_date: (.data.created_utc | strftime("%Y-%m-%d %H:%M:%S")),
                search_term: "'"$query"'"
            }' 2>/dev/null || echo ""
    else
        echo "Warning: jq not installed. Install jq for proper JSON parsing." >&2
        echo "$response"
    fi
}

# Iterate through subreddits and search terms
for subreddit in "${SUBREDDITS[@]}"; do
    echo ""
    echo "📁 r/$subreddit"
    
    for term in "${SEARCH_TERMS[@]}"; do
        echo "   🔎 Searching: \"$term\""
        
        local results=$(search_reddit "$subreddit" "$term")
        
        if [ -n "$results" ] && [ "$results" != "" ]; then
            # Add to results array
            while IFS= read -r line; do
                if [ -n "$line" ]; then
                    RESULTS+=("$line")
                fi
            done <<< "$results"
        fi
        
        # Be nice to Reddit's API - small delay between requests
        sleep 0.5
    done
done

echo ""
echo "📊 Processing results..."

# Combine all results into a single JSON array
if command -v jq &> /dev/null; then
    # Create proper JSON array from results
    {
        echo '{'
        echo '  "metadata": {'
        echo '    "date": "'$(date -Iseconds)'",'
        echo '    "subreddits": ["'$(IFS=','; echo "${SUBREDDITS[*]}" | sed 's/ /", "/g')'"],'
        echo '    "search_terms": ["'$(IFS=','; echo "${SEARCH_TERMS[*]}" | sed 's/ /", "/g')'"],'
        echo '    "total_results": '${#RESULTS[@]}''
        echo '  },'
        echo '  "results": ['
        
        first=true
        for result in "${RESULTS[@]}"; do
            if [ -n "$result" ]; then
                if [ "$first" = true ]; then
                    first=false
                else
                    echo ','
                fi
                echo "$result"
            fi
        done
        
        echo ''
        echo '  ]'
        echo '}'
    } > "$OUTPUT_FILE"
    
    echo "✅ Results saved to: $OUTPUT_FILE"
    echo "   Total posts found: ${#RESULTS[@]}"
else
    echo "❌ Error: jq is required for proper JSON output."
    echo "   Install with: brew install jq"
    exit 1
fi

# Summary
echo ""
echo "📈 Summary"
echo "   Subreddits searched: ${#SUBREDDITS[@]}"
echo "   Search terms used: ${#SEARCH_TERMS[@]}"
echo "   API calls made: $(( ${#SUBREDDITS[@]} * ${#SEARCH_TERMS[@]} ))"
echo "   Posts found: ${#RESULTS[@]}"
echo ""
echo "Run this script as a cron job to track booking frustration trends over time:"
echo "   0 9 * * * /path/to/openbay/scripts/reddit-recon.sh >> /var/log/openbay-reddit.log 2>&1"
