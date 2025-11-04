import { useParams } from 'react-router-dom';
import products from '../data/products.json';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus } from '@fortawesome/free-solid-svg-icons';
import { faHeart } from '@fortawesome/free-regular-svg-icons';
import { useState } from 'react';
import './ProductDetails.css';
import useCartStore from '../store/cartStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
function ProductDetails() {
  const { id: idParam = '' } = useParams();
  const addToCart = useCartStore(state => state.addToCart);
  const [fitMode, setFitMode] = useState('cover');
  const [loaded, setLoaded] = useState(false);
  const [liked, setLiked] = useState(false);
  const navigate = useNavigate();

  const handleImageLoad = e => {
    e.target.naturalWidth > e.target.naturalHeight ? setFitMode('contain') : setFitMode('cover');
    setLoaded(true);
  };

  const handleAdd = () => {
    addToCart(product, 1);
    toast.custom(
      t => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            background: '#969696',
            border: '1px solid #00c853',
            color: '#fff',
            borderRadius: '10px',
            padding: '14px 18px',
            boxShadow: '0 0 12px rgba(0, 255, 128, 0.25)',
            animation: t.visible ? 'fadeIn 0.3s ease' : 'fadeOut 0.3s ease forwards',
            width: '320px',
          }}
        >
          <img
            src={new URL(`../assets/${product.image}`, import.meta.url).href}
            alt={product.name}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '8px',
              objectFit: 'cover',
              border: '1px solid #00c853',
            }}
          />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 600, fontFamily: 'Exo 2' }}>{product.name}</p>
            <p
              style={{
                margin: '4px 0 8px 0',
                color: '#b2ff59',
                fontSize: '14px',
                fontFamily: 'Exo 2',
              }}
            >
              Added to cart
            </p>
            <button
              style={{
                background: 'linear-gradient(135deg, #00e676, #00c853)',
                border: 'none',
                fontFamily: 'Exo 2',
                color: '#fff',
                borderRadius: '6px',
                padding: '6px 10px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: '0.25s',
              }}
              onClick={() => {
                toast.dismiss(t.id);
                navigate('/cart');
              }}
            >
              View Cart
            </button>
          </div>
          <p
            style={{
              flex: 0.5,
              fontSize: 32,
              fontWeight: 'bold',
              fontFamily: 'Exo 2',
              color: '#00e676',
              webkitTextStroke: '0.3px black',
            }}
          >
            {product.currency}
            {product.price}
          </p>
        </div>
      ),
      {
        duration: 2500,
        position: 'top-right',
      }
    );
  };

  const serialNo = idParam.split('-').pop();
  const src = products.find(p => String(p.serialNo) === String(serialNo));
  src.id = serialNo;
  if (!src) {
    return (
      <div className="product-description">
        <h3>Product not found</h3>
      </div>
    );
  }
  const product = {
    ...src,
    quantity: src.quantity ?? 1,
  };
  const { name, currency, price, image } = product;
  const imageUrl = new URL(`../assets/${image}`, import.meta.url).href;
  return (
    <div className="product-description">
      <div className="product-img-container">
        <img
          src={imageUrl}
          className="product-img"
          loading="lazy"
          alt={`${name}`}
          onLoad={handleImageLoad}
          style={{
            objectFit: fitMode,
            opacity: loaded ? 1 : 0,
          }}
        ></img>
      </div>
      <div className="product-card">
        <h3>{serialNo}</h3>
        <h2>{name}</h2>
        <h1>
          {currency}
          {price.toFixed(2)}
        </h1>
        <div>
          <button
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              handleAdd();
            }}
          >
            <FontAwesomeIcon icon={faCartPlus} /> Add to Cart
          </button>
          <button
            className="fav-btn"
            aria-pressed={liked}
            title={liked ? 'Remove from favorites' : 'Add to favorites'}
            onClick={() => setLiked(liked => !liked)}
          >
            <FontAwesomeIcon icon={liked ? faHeartSolid : faHeart} />
          </button>
        </div>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptates corrupti laudantium
          culpa tempora repellendus? Vel sint aut deserunt maiores dolorem reiciendis doloremque,
          facilis, rem pariatur distinctio cumque error quam reprehenderit. Lorem ipsum dolor sit
          amet consectetur adipisicing elit. Accusamus earum praesentium architecto excepturi
          aspernatur distinctio officia veniam, voluptatibus incidunt libero maiores ipsam, placeat
          beatae nobis sint laborum neque? Saepe, id. Lorem ipsum dolor sit amet consectetur
          adipisicing elit. Nemo labore impedit sit commodi laudantium, natus cumque nihil
          voluptates aspernatur, aliquid reiciendis ab, voluptatem rem enim magni. Consequatur
          inventore assumenda dolorum? Lorem ipsum dolor sit amet, consectetur adipisicing elit.
          Voluptates corrupti laudantium culpa tempora repellendus? Vel sint aut deserunt maiores
          dolorem reiciendis doloremque, facilis, rem pariatur distinctio cumque error quam
          reprehenderit. Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusamus earum
          praesentium architecto excepturi aspernatur distinctio officia veniam, voluptatibus
          incidunt libero maiores ipsam, placeat beatae nobis sint laborum neque? Saepe, id. Lorem
          ipsum dolor sit amet consectetur adipisicing elit. Nemo labore impedit sit commodi
          laudantium, natus cumque nihil voluptates aspernatur, aliquid reiciendis ab, voluptatem
          rem enim magni. Consequatur inventore assumenda dolorum? Lorem ipsum dolor sit amet,
          consectetur adipisicing elit. Voluptates corrupti laudantium culpa tempora repellendus?
          Vel sint aut deserunt maiores dolorem reiciendis doloremque, facilis, rem pariatur
          distinctio cumque error quam reprehenderit. Lorem ipsum dolor sit amet consectetur
          adipisicing elit. Accusamus earum praesentium architecto excepturi aspernatur distinctio
          officia veniam, voluptatibus incidunt libero maiores ipsam, placeat beatae nobis sint
          laborum neque? Saepe, id. Lorem ipsum dolor sit amet consectetur adipisicing elit. Nemo
          labore impedit sit commodi laudantium, natus cumque nihil voluptates aspernatur, aliquid
          reiciendis ab, voluptatem rem enim magni. Consequatur inventore assumenda dolorum? Lorem
          ipsum dolor sit amet, consectetur adipisicing elit. Voluptates corrupti laudantium culpa
          tempora repellendus? Vel sint aut deserunt maiores dolorem reiciendis doloremque, facilis,
          rem pariatur distinctio cumque error quam reprehenderit. Lorem ipsum dolor sit amet
          consectetur adipisicing elit. Accusamus earum praesentium architecto excepturi aspernatur
          distinctio officia veniam, voluptatibus incidunt libero maiores ipsam, placeat beatae
          nobis sint laborum neque? Saepe, id. Lorem ipsum dolor sit amet consectetur adipisicing
          elit. Nemo labore impedit sit commodi laudantium, natus cumque nihil voluptates
          aspernatur, aliquid reiciendis ab, voluptatem rem enim magni. Consequatur inventore
          assumenda dolorum? Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptates
          corrupti laudantium culpa tempora repellendus? Vel sint aut deserunt maiores dolorem
          reiciendis doloremque, facilis, rem pariatur distinctio cumque error quam reprehenderit.
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusamus earum praesentium
          architecto excepturi aspernatur distinctio officia veniam, voluptatibus incidunt libero
          maiores ipsam, placeat beatae nobis sint laborum neque? Saepe, id. Lorem ipsum dolor sit
          amet consectetur adipisicing elit. Nemo labore impedit sit commodi laudantium, natus
          cumque nihil voluptates aspernatur, aliquid reiciendis ab, voluptatem rem enim magni.
          Consequatur inventore assumenda dolorum? Lorem ipsum dolor sit amet, consectetur
          adipisicing elit. Voluptates corrupti laudantium culpa tempora repellendus? Vel sint aut
          deserunt maiores dolorem reiciendis doloremque, facilis, rem pariatur distinctio cumque
          error quam reprehenderit. Lorem ipsum dolor sit amet consectetur adipisicing elit.
          Accusamus earum praesentium architecto excepturi aspernatur distinctio officia veniam,
          voluptatibus incidunt libero maiores ipsam, placeat beatae nobis sint laborum neque?
          Saepe, id. Lorem ipsum dolor sit amet consectetur adipisicing elit. Nemo labore impedit
          sit commodi laudantium, natus cumque nihil voluptates aspernatur, aliquid reiciendis ab,
          voluptatem rem enim magni. Consequatur inventore assumenda dolorum? Lorem ipsum dolor sit
          amet, consectetur adipisicing elit. Voluptates corrupti laudantium culpa tempora
          repellendus? Vel sint aut deserunt maiores dolorem reiciendis doloremque, facilis, rem
          pariatur distinctio cumque error quam reprehenderit. Lorem ipsum dolor sit amet
          consectetur adipisicing elit. Accusamus earum praesentium architecto excepturi aspernatur
          distinctio officia veniam, voluptatibus incidunt libero maiores ipsam, placeat beatae
          nobis sint laborum neque? Saepe, id. Lorem ipsum dolor sit amet consectetur adipisicing
          elit. Nemo labore impedit sit commodi laudantium, natus cumque nihil voluptates
          aspernatur, aliquid reiciendis ab, voluptatem rem enim magni. Consequatur inventore
          assumenda dolorum? Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptates
          corrupti laudantium culpa tempora repellendus? Vel sint aut deserunt maiores dolorem
          reiciendis doloremque, facilis, rem pariatur distinctio cumque error quam reprehenderit.
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusamus earum praesentium
          architecto excepturi aspernatur distinctio officia veniam, voluptatibus incidunt libero
          maiores ipsam, placeat beatae nobis sint laborum neque? Saepe, id. Lorem ipsum dolor sit
          amet consectetur adipisicing elit. Nemo labore impedit sit commodi laudantium, natus
          cumque nihil voluptates aspernatur, aliquid reiciendis ab, voluptatem rem enim magni.
          Consequatur inventore assumenda dolorum? Lorem ipsum dolor sit amet, consectetur
          adipisicing elit. Voluptates corrupti laudantium culpa tempora repellendus? Vel sint aut
          deserunt maiores dolorem reiciendis doloremque, facilis, rem pariatur distinctio cumque
          error quam reprehenderit. Lorem ipsum dolor sit amet consectetur adipisicing elit.
          Accusamus earum praesentium architecto excepturi aspernatur distinctio officia veniam,
          voluptatibus incidunt libero maiores ipsam, placeat beatae nobis sint laborum neque?
          Saepe, id. Lorem ipsum dolor sit amet consectetur adipisicing elit. Nemo labore impedit
          sit commodi laudantium, natus cumque nihil voluptates aspernatur, aliquid reiciendis ab,
          voluptatem rem enim magni. Consequatur inventore assumenda dolorum? Lorem ipsum dolor sit
          amet, consectetur adipisicing elit. Voluptates corrupti laudantium culpa tempora
          repellendus? Vel sint aut deserunt maiores dolorem reiciendis doloremque, facilis, rem
          pariatur distinctio cumque error quam reprehenderit. Lorem ipsum dolor sit amet
          consectetur adipisicing elit. Accusamus earum praesentium architecto excepturi aspernatur
          distinctio officia veniam, voluptatibus incidunt libero maiores ipsam, placeat beatae
          nobis sint laborum neque? Saepe, id. Lorem ipsum dolor sit amet consectetur adipisicing
          elit. Nemo labore impedit sit commodi laudantium, natus cumque nihil voluptates
          aspernatur, aliquid reiciendis ab, voluptatem rem enim magni. Consequatur inventore
          assumenda dolorum? Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptates
          corrupti laudantium culpa tempora repellendus? Vel sint aut deserunt maiores dolorem
          reiciendis doloremque, facilis, rem pariatur distinctio cumque error quam reprehenderit.
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusamus earum praesentium
          architecto excepturi aspernatur distinctio officia veniam, voluptatibus incidunt libero
          maiores ipsam, placeat beatae nobis sint laborum neque? Saepe, id. Lorem ipsum dolor sit
          amet consectetur adipisicing elit. Nemo labore impedit sit commodi laudantium, natus
          cumque nihil voluptates aspernatur, aliquid reiciendis ab, voluptatem rem enim magni.
          Consequatur inventore assumenda dolorum?
        </p>
        <textarea placeholder="Share your thoughts..." />
        <div>
          <button className="product-comment-btn">Comment </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
